import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// The Compliance Center is for compliance and oversight roles.
const COMPLIANCE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPLIANCE_OFFICER,
  UserRole.OPERATIONS,
] as const;

@ApiTags('compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('overview')
  @Roles(...COMPLIANCE_ROLES)
  getOverview() {
    return this.complianceService.getOverview();
  }

  @Get('review-queue')
  @Roles(...COMPLIANCE_ROLES)
  getReviewQueue() {
    return this.complianceService.getReviewQueue();
  }

  @Get('missing-documents')
  @Roles(...COMPLIANCE_ROLES)
  getMissingDocuments() {
    return this.complianceService.getMissingDocuments();
  }

  @Get('document-alerts')
  @Roles(...COMPLIANCE_ROLES)
  getDocumentAlerts() {
    return this.complianceService.getDocumentAlerts();
  }
}
