import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DistributionStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FundsService } from '../funds/funds.service';
import { HoldingsService } from '../holdings/holdings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateDistributionDto } from './dto/create-distribution.dto';

interface AllowedTransition {
  to: DistributionStatus;
  roles: UserRole[];
}

// Approval workflow state machine. Each key lists the legal next states and
// which roles may perform that transition. Enforced server-side so the
// four-eyes approval chain can't be bypassed from the UI.
const DISTRIBUTION_TRANSITIONS: Record<DistributionStatus, AllowedTransition[]> = {
  [DistributionStatus.DRAFT]: [
    { to: DistributionStatus.REVIEWED, roles: [UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.FINANCE] },
  ],
  [DistributionStatus.REVIEWED]: [
    { to: DistributionStatus.APPROVED, roles: [UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER] },
    // allow sending back to DRAFT for correction/recalculation
    { to: DistributionStatus.DRAFT, roles: [UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.FINANCE] },
  ],
  [DistributionStatus.APPROVED]: [
    { to: DistributionStatus.PROCESSING, roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE] },
  ],
  [DistributionStatus.PROCESSING]: [
    { to: DistributionStatus.PAID, roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE] },
  ],
  [DistributionStatus.PAID]: [],
};

@Injectable()
export class DistributionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fundsService: FundsService,
    private readonly holdingsService: HoldingsService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateDistributionDto, createdBy: string) {
    await this.fundsService.findOne(dto.fundId);

    const distribution = await this.prisma.distribution.create({
      data: {
        fundId: dto.fundId,
        distributionPeriod: dto.distributionPeriod,
        distributionDate: new Date(dto.distributionDate),
        distributionAmount: new Prisma.Decimal(dto.distributionAmount),
        distributionPct:
          dto.distributionPct !== undefined ? new Prisma.Decimal(dto.distributionPct) : undefined,
        status: DistributionStatus.DRAFT,
      },
    });

    await this.recordHistory(distribution.id, null, DistributionStatus.DRAFT, createdBy, 'Distribution created');

    // Generate the pro-rata allocations up front so reviewers see the split.
    await this.calculateAllocations(distribution.id);
    return this.findOne(distribution.id);
  }

  async findAll(fundId?: string) {
    return this.prisma.distribution.findMany({
      where: fundId ? { fundId } : {},
      orderBy: { distributionDate: 'desc' },
      include: {
        fund: { select: { id: true, name: true, baseCurrency: true } },
        _count: { select: { allocations: true } },
      },
    });
  }

  async findOne(id: string) {
    const distribution = await this.prisma.distribution.findUnique({
      where: { id },
      include: {
        fund: { select: { id: true, name: true, baseCurrency: true } },
        allocations: {
          include: { investor: { select: { id: true, clientId: true, fullName: true } } },
          orderBy: { amount: 'desc' },
        },
        approvedBy: { select: { id: true, fullName: true } },
        workflowHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!distribution) throw new NotFoundException('Distribution not found');
    return distribution;
  }

  /**
   * Module 7 — pro-rata calculation engine. Splits distributionAmount across
   * all unit holders in proportion to their units held at run time:
   *
   *   share_i = distributionAmount * (units_i / totalUnits)
   *
   * Amounts are computed with full Decimal precision, then rounded to 2 dp.
   * Because rounding a set of shares rarely sums back to the exact total, the
   * penny residual is added to the largest allocation so the allocations sum
   * to distributionAmount to the cent. Only allowed while DRAFT.
   */
  async calculateAllocations(distributionId: string) {
    const distribution = await this.findOne(distributionId);
    if (distribution.status !== DistributionStatus.DRAFT) {
      throw new BadRequestException('Allocations can only be calculated while the distribution is in DRAFT');
    }

    const holdings = await this.holdingsService.getFundHoldings(distribution.fundId);
    const totalUnits = holdings.reduce((acc, h) => acc.plus(h.units), new Prisma.Decimal(0));
    if (totalUnits.lte(0)) {
      throw new BadRequestException('No units are held in this fund, so there is nothing to allocate');
    }

    const amount = new Prisma.Decimal(distribution.distributionAmount);
    let running = new Prisma.Decimal(0);
    const rows = holdings.map((h) => {
      const share = amount.mul(h.units).div(totalUnits).toDecimalPlaces(2);
      running = running.plus(share);
      return { investorId: h.investorId, unitsHeldAtRun: h.units, amount: share };
    });

    // Push the rounding residual (positive or negative) onto the largest share.
    const residual = amount.minus(running);
    if (!residual.isZero() && rows.length > 0) {
      let largest = 0;
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].amount.gt(rows[largest].amount)) largest = i;
      }
      rows[largest].amount = rows[largest].amount.plus(residual);
    }

    // Replace any prior allocations (recalculation is idempotent).
    await this.prisma.$transaction([
      this.prisma.distributionAllocation.deleteMany({ where: { distributionId } }),
      this.prisma.distributionAllocation.createMany({
        data: rows.map((r) => ({
          distributionId,
          investorId: r.investorId,
          amount: r.amount,
          unitsHeldAtRun: r.unitsHeldAtRun,
        })),
      }),
    ]);

    return this.findOne(distributionId);
  }

  async transition(
    id: string,
    toStatus: DistributionStatus,
    user: { userId: string; role: UserRole },
    opts: { paymentReference?: string; note?: string } = {},
  ) {
    const distribution = await this.findOne(id);
    const allowed = DISTRIBUTION_TRANSITIONS[distribution.status].find((t) => t.to === toStatus);
    if (!allowed) {
      throw new BadRequestException(
        `Cannot move a distribution from ${distribution.status} to ${toStatus}`,
      );
    }
    if (!allowed.roles.includes(user.role)) {
      throw new ForbiddenException(`Your role cannot move a distribution to ${toStatus}`);
    }

    const data: Prisma.DistributionUpdateInput = { status: toStatus };
    if (toStatus === DistributionStatus.APPROVED) {
      data.approvedBy = { connect: { id: user.userId } };
    }
    if (toStatus === DistributionStatus.PAID) {
      data.paymentDate = new Date();
      if (opts.paymentReference) data.paymentReference = opts.paymentReference;
    }

    await this.prisma.distribution.update({ where: { id }, data });
    await this.recordHistory(id, distribution.status, toStatus, user.userId, opts.note);

    // On payout, notify every allocated investor (Module 11). Notifications
    // are best-effort and never block the transition.
    if (toStatus === DistributionStatus.PAID) {
      for (const allocation of distribution.allocations) {
        await this.notifications.notifyInvestor(allocation.investorId, 'DISTRIBUTION_PAID', {
          distributionId: id,
          period: distribution.distributionPeriod,
          amount: allocation.amount.toString(),
        });
      }
    }

    return this.findOne(id);
  }

  private recordHistory(
    distributionId: string,
    fromStage: DistributionStatus | null,
    toStage: DistributionStatus,
    changedBy: string,
    note?: string | null,
  ) {
    return this.prisma.workflowHistory.create({
      data: {
        distributionId,
        entityType: 'DISTRIBUTION',
        fromStage: fromStage ?? undefined,
        toStage,
        changedBy,
        note: note ?? undefined,
      },
    });
  }
}
