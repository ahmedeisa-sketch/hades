import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFundDto } from './dto/create-fund.dto';
import { CreateNavSnapshotDto } from './dto/create-nav-snapshot.dto';

@Injectable()
export class FundsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateFundDto) {
    return this.prisma.fund.create({
      data: {
        name: dto.name,
        baseCurrency: dto.baseCurrency ?? 'AED',
        managementFeePct: dto.managementFeePct,
        performanceFeePct: dto.performanceFeePct,
        lockupMonths: dto.lockupMonths ?? 0,
        noticeDays: dto.noticeDays ?? 30,
      },
    });
  }

  findAll() {
    return this.prisma.fund.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const fund = await this.prisma.fund.findUnique({ where: { id } });
    if (!fund) throw new NotFoundException('Fund not found');
    return fund;
  }

  async listNav(fundId: string) {
    await this.findOne(fundId);
    return this.prisma.navSnapshot.findMany({
      where: { fundId },
      orderBy: { asOfDate: 'desc' },
    });
  }

  /**
   * The most recent NAV snapshot for a fund — the entry point subscriptions
   * use to price fund units. Returns null when a fund has no NAV history yet.
   */
  async getLatestNav(fundId: string) {
    return this.prisma.navSnapshot.findFirst({
      where: { fundId },
      orderBy: { asOfDate: 'desc' },
    });
  }

  async createNav(fundId: string, dto: CreateNavSnapshotDto, enteredBy: string) {
    await this.findOne(fundId);

    // schema has @@unique([fundId, asOfDate]) — surface a clean 409 rather
    // than leaking a Prisma unique-constraint error.
    const existing = await this.prisma.navSnapshot.findUnique({
      where: { fundId_asOfDate: { fundId, asOfDate: new Date(dto.asOfDate) } },
    });
    if (existing) {
      throw new ConflictException('A NAV snapshot already exists for this fund and date');
    }

    return this.prisma.navSnapshot.create({
      data: {
        fundId,
        asOfDate: new Date(dto.asOfDate),
        navPerUnit: dto.navPerUnit,
        totalAum: dto.totalAum,
        enteredBy,
      },
    });
  }
}
