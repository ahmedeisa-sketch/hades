import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RedemptionStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FundsService } from '../funds/funds.service';
import { HoldingsService } from '../holdings/holdings.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRedemptionDto } from './dto/create-redemption.dto';

interface AllowedTransition {
  to: RedemptionStatus;
  roles: UserRole[];
}

// Multi-stage review workflow. A request runs Compliance -> Operations ->
// Approval -> Settlement -> Paid, and can be rejected at any review stage.
const REDEMPTION_TRANSITIONS: Record<RedemptionStatus, AllowedTransition[]> = {
  [RedemptionStatus.REQUESTED]: [
    {
      to: RedemptionStatus.COMPLIANCE_REVIEW,
      roles: [UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER, UserRole.OPERATIONS],
    },
  ],
  [RedemptionStatus.COMPLIANCE_REVIEW]: [
    { to: RedemptionStatus.OPERATIONS_REVIEW, roles: [UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER] },
    { to: RedemptionStatus.REJECTED, roles: [UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER] },
  ],
  [RedemptionStatus.OPERATIONS_REVIEW]: [
    { to: RedemptionStatus.APPROVED, roles: [UserRole.SUPER_ADMIN, UserRole.OPERATIONS] },
    { to: RedemptionStatus.REJECTED, roles: [UserRole.SUPER_ADMIN, UserRole.OPERATIONS] },
  ],
  [RedemptionStatus.APPROVED]: [
    { to: RedemptionStatus.SETTLEMENT_PROCESSING, roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE] },
  ],
  [RedemptionStatus.SETTLEMENT_PROCESSING]: [
    { to: RedemptionStatus.PAID, roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE] },
  ],
  [RedemptionStatus.PAID]: [],
  [RedemptionStatus.REJECTED]: [],
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

@Injectable()
export class RedemptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fundsService: FundsService,
    private readonly holdingsService: HoldingsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Module 8 — creates a redemption request with dates derived from the
   * fund's rules:
   *
   *   eligibilityDate     = investor's entry date + fund.lockupMonths
   *   finalSettlementDate = request date         + fund.noticeDays
   *
   * Units are priced from the fund's latest NAV, and the request is capped at
   * the investor's currently-held units. Lock-up is *recorded* here and
   * *enforced* at approval time (see transition()).
   */
  async create(investorId: string, dto: CreateRedemptionDto, createdBy: string) {
    const investor = await this.prisma.investor.findFirst({
      where: { id: investorId, deletedAt: null },
      select: { id: true },
    });
    if (!investor) throw new NotFoundException('Investor not found');

    const fund = await this.fundsService.findOne(dto.fundId);

    const latestNav = await this.fundsService.getLatestNav(dto.fundId);
    if (!latestNav) {
      throw new BadRequestException(
        'Cannot value a redemption: the fund has no NAV snapshot yet. Enter a NAV first.',
      );
    }

    const navPerUnit = new Prisma.Decimal(latestNav.navPerUnit);
    const requestAmount = new Prisma.Decimal(dto.requestAmount);
    const unitsRedeemed = requestAmount.div(navPerUnit);

    const unitsHeld = await this.holdingsService.getInvestorUnits(investorId, dto.fundId);
    if (unitsHeld.lte(0)) {
      throw new BadRequestException('Investor holds no units in this fund');
    }
    if (unitsRedeemed.gt(unitsHeld)) {
      throw new BadRequestException(
        `Redemption of ${unitsRedeemed.toFixed(6)} units exceeds the ${unitsHeld.toFixed(6)} units held`,
      );
    }

    // Entry date = the investor's earliest subscription in this fund.
    const firstSub = await this.prisma.subscription.findFirst({
      where: { investorId, fundId: dto.fundId, deletedAt: null },
      orderBy: [{ effectiveDate: 'asc' }, { transferDate: 'asc' }, { createdAt: 'asc' }],
      select: { effectiveDate: true, transferDate: true, createdAt: true },
    });
    const entryDate =
      firstSub?.effectiveDate ?? firstSub?.transferDate ?? firstSub?.createdAt ?? new Date();

    const requestDate = new Date();
    const eligibilityDate = addMonths(entryDate, fund.lockupMonths);
    const finalSettlementDate = addDays(requestDate, fund.noticeDays);

    const redemption = await this.prisma.redemption.create({
      data: {
        investorId,
        fundId: dto.fundId,
        requestDate,
        requestAmount,
        unitsRedeemed,
        eligibilityDate,
        finalSettlementDate,
        status: RedemptionStatus.REQUESTED,
      },
    });

    await this.recordHistory(
      redemption.id,
      null,
      RedemptionStatus.REQUESTED,
      createdBy,
      'Redemption requested',
    );
    await this.notifications.notifyInvestor(investorId, 'REDEMPTION_REQUESTED', {
      redemptionId: redemption.id,
      requestAmount: dto.requestAmount,
    });
    return this.findOne(redemption.id);
  }

  async findAll(params: { investorId?: string; status?: RedemptionStatus } = {}) {
    return this.prisma.redemption.findMany({
      where: {
        ...(params.investorId ? { investorId: params.investorId } : {}),
        ...(params.status ? { status: params.status } : {}),
      },
      orderBy: { requestDate: 'desc' },
      include: {
        investor: { select: { id: true, clientId: true, fullName: true } },
        fund: { select: { id: true, name: true, baseCurrency: true } },
      },
    });
  }

  async findOne(id: string) {
    const redemption = await this.prisma.redemption.findUnique({
      where: { id },
      include: {
        investor: { select: { id: true, clientId: true, fullName: true } },
        fund: { select: { id: true, name: true, baseCurrency: true } },
        reviewedBy: { select: { id: true, fullName: true } },
        workflowHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!redemption) throw new NotFoundException('Redemption not found');
    return redemption;
  }

  async transition(
    id: string,
    toStatus: RedemptionStatus,
    user: { userId: string; role: UserRole },
    opts: { paymentReference?: string; note?: string } = {},
  ) {
    const redemption = await this.findOne(id);
    const allowed = REDEMPTION_TRANSITIONS[redemption.status].find((t) => t.to === toStatus);
    if (!allowed) {
      throw new BadRequestException(
        `Cannot move a redemption from ${redemption.status} to ${toStatus}`,
      );
    }
    if (!allowed.roles.includes(user.role)) {
      throw new ForbiddenException(`Your role cannot move a redemption to ${toStatus}`);
    }

    // Enforce the lock-up: a redemption cannot be approved before its
    // eligibility date. Rejection is always allowed.
    if (
      toStatus === RedemptionStatus.APPROVED &&
      redemption.eligibilityDate &&
      redemption.eligibilityDate > new Date()
    ) {
      throw new BadRequestException(
        `Redemption is within its lock-up period and is not eligible until ${redemption.eligibilityDate.toISOString().slice(0, 10)}`,
      );
    }

    const data: Prisma.RedemptionUpdateInput = { status: toStatus };
    if (
      toStatus === RedemptionStatus.OPERATIONS_REVIEW ||
      toStatus === RedemptionStatus.APPROVED ||
      toStatus === RedemptionStatus.REJECTED
    ) {
      data.reviewedBy = { connect: { id: user.userId } };
    }
    if (toStatus === RedemptionStatus.PAID) {
      data.paymentDate = new Date();
      if (opts.paymentReference) data.paymentReference = opts.paymentReference;
    }

    await this.prisma.redemption.update({ where: { id }, data });
    await this.recordHistory(id, redemption.status, toStatus, user.userId, opts.note);

    if (toStatus === RedemptionStatus.PAID) {
      await this.notifications.notifyInvestor(redemption.investorId, 'REDEMPTION_PAID', {
        redemptionId: id,
        paymentReference: opts.paymentReference ?? null,
      });
    }

    return this.findOne(id);
  }

  private recordHistory(
    redemptionId: string,
    fromStage: RedemptionStatus | null,
    toStage: RedemptionStatus,
    changedBy: string,
    note?: string | null,
  ) {
    return this.prisma.workflowHistory.create({
      data: {
        redemptionId,
        entityType: 'REDEMPTION',
        fromStage: fromStage ?? undefined,
        toStage,
        changedBy,
        note: note ?? undefined,
      },
    });
  }
}
