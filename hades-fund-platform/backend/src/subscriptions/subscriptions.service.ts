import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FundsService } from '../funds/funds.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fundsService: FundsService,
  ) {}

  private async assertInvestorExists(investorId: string) {
    const investor = await this.prisma.investor.findFirst({
      where: { id: investorId, deletedAt: null },
      select: { id: true },
    });
    if (!investor) throw new NotFoundException('Investor not found');
  }

  /**
   * Module 6 — creates a subscription and derives fund units automatically
   * from the fund's most recent NAV snapshot:
   *
   *   navPerUnitAtEntry = latest NavSnapshot.navPerUnit
   *   allocationAmount  = dto.allocationAmount ?? dto.subscriptionAmount
   *   fundUnits         = allocationAmount / navPerUnitAtEntry
   *
   * Uses Prisma.Decimal end-to-end so unit counts aren't subject to binary
   * floating-point error. Fails clearly if the fund has no NAV yet, since
   * units can't be priced without one.
   */
  async create(investorId: string, dto: CreateSubscriptionDto, createdBy: string) {
    await this.assertInvestorExists(investorId);

    const latestNav = await this.fundsService.getLatestNav(dto.fundId);
    if (!latestNav) {
      throw new BadRequestException(
        'Cannot create a subscription: the fund has no NAV snapshot yet. Enter a NAV first.',
      );
    }

    const navPerUnit = new Prisma.Decimal(latestNav.navPerUnit);
    const allocationAmount = new Prisma.Decimal(
      dto.allocationAmount ?? dto.subscriptionAmount,
    );
    const fundUnits = allocationAmount.div(navPerUnit);

    return this.prisma.subscription.create({
      data: {
        investorId,
        fundId: dto.fundId,
        subscriptionAmount: new Prisma.Decimal(dto.subscriptionAmount),
        allocationAmount,
        fundUnits,
        navPerUnitAtEntry: navPerUnit,
        transferDate: dto.transferDate ? new Date(dto.transferDate) : undefined,
        transferReference: dto.transferReference,
        effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
        createdBy,
      },
      include: { fund: { select: { id: true, name: true, baseCurrency: true } } },
    });
  }

  async listForInvestor(investorId: string) {
    await this.assertInvestorExists(investorId);
    return this.prisma.subscription.findMany({
      where: { investorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { fund: { select: { id: true, name: true, baseCurrency: true } } },
    });
  }

  async softDelete(id: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    return this.prisma.subscription.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
