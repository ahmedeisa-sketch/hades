import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toCsv, isoDate } from './csv.util';

/**
 * Reporting (Phase 4, Module 12). Produces CSV exports from live data. CSV is
 * implemented dependency-free; PDF and Excel exports are a documented
 * follow-up (add a formatter here and content-type in the controller — the
 * queries below are the reusable part).
 */
@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async investorsCsv(): Promise<string> {
    const investors = await this.prisma.investor.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { relationshipManager: { select: { fullName: true } } },
    });

    return toCsv(
      ['Client ID', 'Full name', 'Email', 'Mobile', 'Type', 'Status', 'KYC', 'AML', 'Source of funds', 'Risk', 'Relationship manager', 'Created'],
      investors.map((i) => [
        i.clientId,
        i.fullName,
        i.email,
        i.mobile,
        i.investorType,
        i.status,
        i.kycStatus,
        i.amlStatus,
        i.sourceOfFundsStatus,
        i.riskRating ?? '',
        i.relationshipManager?.fullName ?? '',
        isoDate(i.createdAt),
      ]),
    );
  }

  async subscriptionsCsv(): Promise<string> {
    const subs = await this.prisma.subscription.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        investor: { select: { clientId: true, fullName: true } },
        fund: { select: { name: true, baseCurrency: true } },
      },
    });

    return toCsv(
      ['Client ID', 'Investor', 'Fund', 'Currency', 'Subscription amount', 'Allocation amount', 'Fund units', 'NAV at entry', 'Effective date', 'Created'],
      subs.map((s) => [
        s.investor.clientId,
        s.investor.fullName,
        s.fund.name,
        s.fund.baseCurrency,
        s.subscriptionAmount.toString(),
        s.allocationAmount.toString(),
        s.fundUnits.toString(),
        s.navPerUnitAtEntry.toString(),
        isoDate(s.effectiveDate),
        isoDate(s.createdAt),
      ]),
    );
  }

  async redemptionsCsv(): Promise<string> {
    const redemptions = await this.prisma.redemption.findMany({
      orderBy: { requestDate: 'desc' },
      include: {
        investor: { select: { clientId: true, fullName: true } },
        fund: { select: { name: true, baseCurrency: true } },
      },
    });

    return toCsv(
      ['Client ID', 'Investor', 'Fund', 'Currency', 'Request amount', 'Units', 'Status', 'Requested', 'Eligible from', 'Settlement', 'Payment date'],
      redemptions.map((r) => [
        r.investor.clientId,
        r.investor.fullName,
        r.fund.name,
        r.fund.baseCurrency,
        r.requestAmount.toString(),
        r.unitsRedeemed.toString(),
        r.status,
        isoDate(r.requestDate),
        isoDate(r.eligibilityDate),
        isoDate(r.finalSettlementDate),
        isoDate(r.paymentDate),
      ]),
    );
  }

  async distributionsCsv(): Promise<string> {
    const distributions = await this.prisma.distribution.findMany({
      orderBy: { distributionDate: 'desc' },
      include: {
        fund: { select: { name: true, baseCurrency: true } },
        _count: { select: { allocations: true } },
      },
    });

    return toCsv(
      ['Period', 'Fund', 'Currency', 'Date', 'Amount', 'Percentage', 'Status', 'Allocations', 'Payment date'],
      distributions.map((d) => [
        d.distributionPeriod,
        d.fund.name,
        d.fund.baseCurrency,
        isoDate(d.distributionDate),
        d.distributionAmount.toString(),
        d.distributionPct ? d.distributionPct.toString() : '',
        d.status,
        d._count.allocations,
        isoDate(d.paymentDate),
      ]),
    );
  }

  async distributionAllocationsCsv(distributionId: string): Promise<string> {
    const distribution = await this.prisma.distribution.findUnique({
      where: { id: distributionId },
      select: { id: true },
    });
    if (!distribution) throw new NotFoundException('Distribution not found');

    const allocations = await this.prisma.distributionAllocation.findMany({
      where: { distributionId },
      orderBy: { amount: 'desc' },
      include: { investor: { select: { clientId: true, fullName: true } } },
    });

    return toCsv(
      ['Client ID', 'Investor', 'Units held at run', 'Allocation amount'],
      allocations.map((a) => [
        a.investor.clientId,
        a.investor.fullName,
        a.unitsHeldAtRun.toString(),
        a.amount.toString(),
      ]),
    );
  }
}
