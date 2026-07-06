import { Injectable } from '@nestjs/common';
import { InvestorStatus, RedemptionStatus, ReviewStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Module 1 — Dashboard KPI cards.
   * Note: totalAum here sums subscription allocationAmount as a placeholder
   * for a true NAV-based valuation, which belongs to the NavSnapshot /
   * valuation engine planned for a later phase.
   */
  async getKpis() {
    const [
      totalInvestors,
      activeInvestors,
      pendingInvestors,
      fundUnitsAgg,
      allocationAgg,
      distributionsPaidAgg,
      redemptionsPaidAgg,
      outstandingRedemptionsAgg,
      kycApprovedCount,
    ] = await Promise.all([
      this.prisma.investor.count({ where: { deletedAt: null } }),
      this.prisma.investor.count({
        where: { deletedAt: null, status: InvestorStatus.ACTIVE },
      }),
      this.prisma.investor.count({
        where: {
          deletedAt: null,
          status: {
            in: [
              InvestorStatus.DRAFT,
              InvestorStatus.DOCUMENTS_UPLOADED,
              InvestorStatus.KYC_REVIEW,
              InvestorStatus.COMPLIANCE_REVIEW,
            ],
          },
        },
      }),
      this.prisma.subscription.aggregate({
        where: { deletedAt: null },
        _sum: { fundUnits: true },
      }),
      this.prisma.subscription.aggregate({
        where: { deletedAt: null },
        _sum: { allocationAmount: true },
      }),
      this.prisma.distribution.aggregate({
        where: { status: 'PAID' },
        _sum: { distributionAmount: true },
      }),
      this.prisma.redemption.aggregate({
        where: { status: RedemptionStatus.PAID },
        _sum: { requestAmount: true },
      }),
      this.prisma.redemption.aggregate({
        where: {
          status: {
            in: [
              RedemptionStatus.REQUESTED,
              RedemptionStatus.COMPLIANCE_REVIEW,
              RedemptionStatus.OPERATIONS_REVIEW,
              RedemptionStatus.APPROVED,
              RedemptionStatus.SETTLEMENT_PROCESSING,
            ],
          },
        },
        _sum: { requestAmount: true },
      }),
      this.prisma.investor.count({
        where: { deletedAt: null, kycStatus: ReviewStatus.APPROVED },
      }),
    ]);

    const complianceCompletionPct =
      totalInvestors > 0 ? Math.round((kycApprovedCount / totalInvestors) * 100) : 0;

    return {
      totalInvestors,
      activeInvestors,
      pendingInvestors,
      totalAum: allocationAgg._sum.allocationAmount ?? 0,
      fundUnitsOutstanding: fundUnitsAgg._sum.fundUnits ?? 0,
      totalDistributionsPaid: distributionsPaidAgg._sum.distributionAmount ?? 0,
      totalRedemptionsPaid: redemptionsPaidAgg._sum.requestAmount ?? 0,
      outstandingRedemptions: outstandingRedemptionsAgg._sum.requestAmount ?? 0,
      complianceCompletionPct,
    };
  }

  async getInvestorStatusBreakdown() {
    const grouped = await this.prisma.investor.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
    });
    return grouped.map((g: (typeof grouped)[number]) => ({
      status: g.status,
      count: g._count._all,
    }));
  }

  async getRedemptionPipeline() {
    const grouped = await this.prisma.redemption.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { requestAmount: true },
    });
    return grouped.map((g: (typeof grouped)[number]) => ({
      status: g.status,
      count: g._count._all,
      amount: g._sum.requestAmount ?? 0,
    }));
  }
}
