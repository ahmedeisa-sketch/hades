import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Investor Portal (Phase 4, Module 9) — strictly read-only and strictly
 * scoped to the investor linked to the logged-in account. Every method
 * resolves the caller's own Investor via Investor.portalUserId, so an
 * investor can never read another investor's data by guessing an id.
 */
@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOwnInvestor(userId: string) {
    const investor = await this.prisma.investor.findFirst({
      where: { portalUserId: userId, deletedAt: null },
      select: { id: true },
    });
    if (!investor) {
      throw new ForbiddenException('No investor profile is linked to this account');
    }
    return investor;
  }

  async getProfile(userId: string) {
    await this.getOwnInvestor(userId);
    return this.prisma.investor.findFirst({
      where: { portalUserId: userId, deletedAt: null },
      select: {
        id: true,
        clientId: true,
        fullName: true,
        email: true,
        mobile: true,
        nationality: true,
        country: true,
        investorType: true,
        status: true,
        kycStatus: true,
        amlStatus: true,
        sourceOfFundsStatus: true,
        riskRating: true,
        createdAt: true,
      },
    });
  }

  async getSubscriptions(userId: string) {
    const { id } = await this.getOwnInvestor(userId);
    return this.prisma.subscription.findMany({
      where: { investorId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { fund: { select: { id: true, name: true, baseCurrency: true } } },
    });
  }

  async getDistributions(userId: string) {
    const { id } = await this.getOwnInvestor(userId);
    return this.prisma.distributionAllocation.findMany({
      where: { investorId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        distribution: {
          select: {
            id: true,
            distributionPeriod: true,
            distributionDate: true,
            status: true,
            paymentDate: true,
            fund: { select: { name: true, baseCurrency: true } },
          },
        },
      },
    });
  }

  async getRedemptions(userId: string) {
    const { id } = await this.getOwnInvestor(userId);
    return this.prisma.redemption.findMany({
      where: { investorId: id },
      orderBy: { requestDate: 'desc' },
      include: { fund: { select: { id: true, name: true, baseCurrency: true } } },
    });
  }

  async getDocuments(userId: string) {
    const { id } = await this.getOwnInvestor(userId);
    // Metadata only — no storage keys are exposed to the portal.
    return this.prisma.investorDocument.findMany({
      where: { investorId: id, deletedAt: null },
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
      select: {
        id: true,
        category: true,
        type: true,
        fileName: true,
        version: true,
        expiryDate: true,
        uploadedAt: true,
      },
    });
  }

  /**
   * A lightweight portfolio statement: total units held, total invested, and
   * total distributions received, per fund and in aggregate.
   */
  async getStatement(userId: string) {
    const { id } = await this.getOwnInvestor(userId);

    const [subAgg, distAgg, redemptionAgg] = await Promise.all([
      this.prisma.subscription.aggregate({
        where: { investorId: id, deletedAt: null },
        _sum: { fundUnits: true, allocationAmount: true, subscriptionAmount: true },
      }),
      this.prisma.distributionAllocation.aggregate({
        where: { investorId: id },
        _sum: { amount: true },
      }),
      this.prisma.redemption.aggregate({
        where: { investorId: id, status: 'PAID' },
        _sum: { unitsRedeemed: true, requestAmount: true },
      }),
    ]);

    const unitsSubscribed = new Prisma.Decimal(subAgg._sum.fundUnits ?? 0);
    const unitsRedeemed = new Prisma.Decimal(redemptionAgg._sum.unitsRedeemed ?? 0);
    const netUnits = unitsSubscribed.minus(unitsRedeemed);

    return {
      totalInvested: subAgg._sum.allocationAmount ?? 0,
      totalSubscribed: subAgg._sum.subscriptionAmount ?? 0,
      netUnitsHeld: netUnits.toString(),
      totalDistributionsReceived: distAgg._sum.amount ?? 0,
      totalRedeemedPaid: redemptionAgg._sum.requestAmount ?? 0,
    };
  }
}
