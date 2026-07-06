import { Injectable } from '@nestjs/common';
import { Prisma, RedemptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface InvestorHolding {
  investorId: string;
  units: Prisma.Decimal;
}

/**
 * Computes fund-unit holdings — the shared basis for both the distribution
 * pro-rata engine (Module 7) and redemption eligibility/limit checks
 * (Module 8).
 *
 * Net units for an investor in a fund =
 *   sum(subscription.fundUnits, not soft-deleted)
 *   - sum(redemption.unitsRedeemed where status = PAID)
 *
 * Only PAID redemptions reduce holdings; in-flight redemption requests do
 * not, so an investor can't have units "double-counted" as still-held while
 * a redemption is only partway through the workflow.
 */
@Injectable()
export class HoldingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getInvestorUnits(investorId: string, fundId: string): Promise<Prisma.Decimal> {
    const [subs, reds] = await Promise.all([
      this.prisma.subscription.aggregate({
        where: { investorId, fundId, deletedAt: null },
        _sum: { fundUnits: true },
      }),
      this.prisma.redemption.aggregate({
        where: { investorId, fundId, status: RedemptionStatus.PAID },
        _sum: { unitsRedeemed: true },
      }),
    ]);

    const subscribed = new Prisma.Decimal(subs._sum.fundUnits ?? 0);
    const redeemed = new Prisma.Decimal(reds._sum.unitsRedeemed ?? 0);
    return subscribed.minus(redeemed);
  }

  /** All investors holding a positive net unit balance in the fund. */
  async getFundHoldings(fundId: string): Promise<InvestorHolding[]> {
    const [subs, reds] = await Promise.all([
      this.prisma.subscription.groupBy({
        by: ['investorId'],
        where: { fundId, deletedAt: null },
        _sum: { fundUnits: true },
      }),
      this.prisma.redemption.groupBy({
        by: ['investorId'],
        where: { fundId, status: RedemptionStatus.PAID },
        _sum: { unitsRedeemed: true },
      }),
    ]);

    const redeemedByInvestor = new Map<string, Prisma.Decimal>(
      reds.map((r): [string, Prisma.Decimal] => [
        r.investorId,
        new Prisma.Decimal(r._sum.unitsRedeemed ?? 0),
      ]),
    );

    return subs
      .map((s) => {
        const subscribed = new Prisma.Decimal(s._sum.fundUnits ?? 0);
        const redeemed = redeemedByInvestor.get(s.investorId) ?? new Prisma.Decimal(0);
        return { investorId: s.investorId, units: subscribed.minus(redeemed) };
      })
      .filter((h) => h.units.gt(0));
  }

  /** Total positive units outstanding across the fund. */
  async getTotalFundUnits(fundId: string): Promise<Prisma.Decimal> {
    const holdings = await this.getFundHoldings(fundId);
    return holdings.reduce((acc, h) => acc.plus(h.units), new Prisma.Decimal(0));
  }
}
