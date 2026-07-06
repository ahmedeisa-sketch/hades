import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

const REPORT_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.FINANCE,
  UserRole.OPERATIONS,
  UserRole.PORTFOLIO_MANAGER,
] as const;

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...REPORT_ROLES)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  private sendCsv(res: Response, filename: string, csv: string) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get('investors.csv')
  async investors(@Res() res: Response) {
    this.sendCsv(res, 'investors.csv', await this.reportingService.investorsCsv());
  }

  @Get('subscriptions.csv')
  async subscriptions(@Res() res: Response) {
    this.sendCsv(res, 'subscriptions.csv', await this.reportingService.subscriptionsCsv());
  }

  @Get('redemptions.csv')
  async redemptions(@Res() res: Response) {
    this.sendCsv(res, 'redemptions.csv', await this.reportingService.redemptionsCsv());
  }

  @Get('distributions.csv')
  async distributions(@Res() res: Response) {
    this.sendCsv(res, 'distributions.csv', await this.reportingService.distributionsCsv());
  }

  @Get('distributions/:id/allocations.csv')
  async allocations(@Param('id') id: string, @Res() res: Response) {
    this.sendCsv(
      res,
      `distribution-${id}-allocations.csv`,
      await this.reportingService.distributionAllocationsCsv(id),
    );
  }
}
