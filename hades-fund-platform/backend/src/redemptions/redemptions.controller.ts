import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RedemptionStatus, UserRole } from '@prisma/client';
import { RedemptionsService } from './redemptions.service';
import { CreateRedemptionDto } from './dto/create-redemption.dto';
import { TransitionRedemptionDto } from './dto/transition-redemption.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

// Union of roles in the redemption workflow; the service enforces which role
// may perform each specific transition.
const WORKFLOW_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.COMPLIANCE_OFFICER,
  UserRole.OPERATIONS,
  UserRole.FINANCE,
] as const;

const VIEW_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.OPERATIONS,
  UserRole.FINANCE,
  UserRole.PORTFOLIO_MANAGER,
  UserRole.COMPLIANCE_OFFICER,
  UserRole.RELATIONSHIP_MANAGER,
] as const;

@ApiTags('redemptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('redemptions')
export class RedemptionsController {
  constructor(private readonly redemptionsService: RedemptionsService) {}

  // Create is nested under an investor since a redemption always belongs to one.
  // Resolves to POST /redemptions/investors/:investorId
  @Post('investors/:investorId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.RELATIONSHIP_MANAGER)
  create(
    @Param('investorId') investorId: string,
    @Body() dto: CreateRedemptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.redemptionsService.create(investorId, dto, user.userId);
  }

  @Get()
  @Roles(...VIEW_ROLES)
  findAll(
    @Query('investorId') investorId?: string,
    @Query('status') status?: RedemptionStatus,
  ) {
    return this.redemptionsService.findAll({ investorId, status });
  }

  @Get(':id')
  @Roles(...VIEW_ROLES)
  findOne(@Param('id') id: string) {
    return this.redemptionsService.findOne(id);
  }

  @Post(':id/transition')
  @Roles(...WORKFLOW_ROLES)
  transition(
    @Param('id') id: string,
    @Body() dto: TransitionRedemptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.redemptionsService.transition(id, dto.toStatus, user, {
      paymentReference: dto.paymentReference,
      note: dto.note,
    });
  }
}
