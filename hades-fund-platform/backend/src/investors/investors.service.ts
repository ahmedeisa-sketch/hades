import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvestorStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';

// Module 3 — Investor Onboarding Workflow (PRD order is the source of truth)
const WORKFLOW_ORDER: InvestorStatus[] = [
  InvestorStatus.DRAFT,
  InvestorStatus.DOCUMENTS_UPLOADED,
  InvestorStatus.KYC_REVIEW,
  InvestorStatus.COMPLIANCE_REVIEW,
  InvestorStatus.APPROVED,
  InvestorStatus.FUNDED,
  InvestorStatus.ACTIVE,
];

@Injectable()
export class InvestorsService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateClientId(): Promise<string> {
    const count = await this.prisma.investor.count();
    return `HAD-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreateInvestorDto, createdBy: string) {
    const clientId = await this.generateClientId();

    const investor = await this.prisma.investor.create({
      data: {
        clientId,
        fullName: dto.fullName,
        mobile: dto.mobile,
        email: dto.email,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        nationality: dto.nationality,
        country: dto.country,
        address: dto.address,
        bankAccountNumber: dto.bankAccountNumber,
        bankName: dto.bankName,
        iban: dto.iban,
        swift: dto.swift,
        virtualIban: dto.virtualIban,
        investorType: dto.investorType,
        relationshipManagerId: dto.relationshipManagerId,
        createdBy,
        updatedBy: createdBy,
      },
    });

    await this.prisma.workflowHistory.create({
      data: {
        investorId: investor.id,
        entityType: 'INVESTOR',
        toStage: InvestorStatus.DRAFT,
        changedBy: createdBy,
        note: 'Investor record created',
      },
    });

    return investor;
  }

  async findAll(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: InvestorStatus;
    relationshipManagerId?: string;
  }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;

    const where: Prisma.InvestorWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.relationshipManagerId
        ? { relationshipManagerId: params.relationshipManagerId }
        : {}),
      ...(params.search
        ? {
            OR: [
              { fullName: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
              { clientId: { contains: params.search, mode: 'insensitive' } },
              { mobile: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.investor.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          relationshipManager: { select: { id: true, fullName: true } },
        },
      }),
      this.prisma.investor.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const investor = await this.prisma.investor.findFirst({
      where: { id, deletedAt: null },
      include: {
        relationshipManager: { select: { id: true, fullName: true } },
        documents: true,
        subscriptions: true,
        workflowHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!investor) throw new NotFoundException('Investor not found');
    return investor;
  }

  async update(id: string, dto: UpdateInvestorDto, updatedBy: string) {
    await this.findOne(id);
    return this.prisma.investor.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        updatedBy,
      },
    });
  }

  async updateCompliance(id: string, dto: UpdateComplianceDto, updatedBy: string) {
    await this.findOne(id);
    return this.prisma.investor.update({
      where: { id },
      data: { ...dto, updatedBy },
    });
  }

  /**
   * Module 3 — advances the investor exactly one step forward (or moves them
   * to INACTIVE / REDEEMED as terminal states from ACTIVE). Rejects any
   * attempt to skip stages so the workflow in the PRD is enforced server-side,
   * not just in the UI.
   */
  async transitionStage(id: string, toStage: InvestorStatus, changedBy: string, note?: string) {
    const investor = await this.findOne(id);
    const currentIndex = WORKFLOW_ORDER.indexOf(investor.status);
    const targetIndex = WORKFLOW_ORDER.indexOf(toStage);

    const isForwardStep = targetIndex === currentIndex + 1;
    const isTerminalFromActive =
      investor.status === InvestorStatus.ACTIVE &&
      [InvestorStatus.INACTIVE, InvestorStatus.REDEEMED].includes(toStage);

    if (!isForwardStep && !isTerminalFromActive) {
      throw new BadRequestException(
        `Cannot move investor from ${investor.status} directly to ${toStage}`,
      );
    }

    const updated = await this.prisma.investor.update({
      where: { id },
      data: { status: toStage, updatedBy: changedBy },
    });

    await this.prisma.workflowHistory.create({
      data: {
        investorId: id,
        entityType: 'INVESTOR',
        fromStage: investor.status,
        toStage,
        changedBy,
        note,
      },
    });

    return updated;
  }

  async softDelete(id: string, updatedBy: string) {
    await this.findOne(id);
    return this.prisma.investor.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy },
    });
  }
}
