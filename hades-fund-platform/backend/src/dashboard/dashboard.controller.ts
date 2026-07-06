import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  getKpis() {
    return this.dashboardService.getKpis();
  }

  @Get('investor-status-breakdown')
  getInvestorStatusBreakdown() {
    return this.dashboardService.getInvestorStatusBreakdown();
  }

  @Get('redemption-pipeline')
  getRedemptionPipeline() {
    return this.dashboardService.getRedemptionPipeline();
  }
}
