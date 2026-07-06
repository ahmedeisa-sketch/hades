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
import { UserRole } from '@prisma/client';
import { DistributionsService } from './distributions.service';
import { CreateDistributionDto } from './dto/create-distribution.dto';
import { TransitionDistributionDto } from './dto/transition-distribution.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

// Union of every role that participates in the distribution workflow; the
// service enforces which role may perform each specific transition.
const WORKFLOW_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.OPERATIONS,
  UserRole.FINANCE,
  UserRole.PORTFOLIO_MANAGER,
] as const;

const VIEW_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.OPERATIONS,
  UserRole.FINANCE,
  UserRole.PORTFOLIO_MANAGER,
  UserRole.COMPLIANCE_OFFICER,
] as const;

@ApiTags('distributions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('distributions')
export class DistributionsController {
  constructor(private readonly distributionsService: DistributionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.FINANCE)
  create(@Body() dto: CreateDistributionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.distributionsService.create(dto, user.userId);
  }

  @Get()
  @Roles(...VIEW_ROLES)
  findAll(@Query('fundId') fundId?: string) {
    return this.distributionsService.findAll(fundId);
  }

  @Get(':id')
  @Roles(...VIEW_ROLES)
  findOne(@Param('id') id: string) {
    return this.distributionsService.findOne(id);
  }

  @Post(':id/recalculate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.FINANCE)
  recalculate(@Param('id') id: string) {
    return this.distributionsService.calculateAllocations(id);
  }

  @Post(':id/transition')
  @Roles(...WORKFLOW_ROLES)
  transition(
    @Param('id') id: string,
    @Body() dto: TransitionDistributionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.distributionsService.transition(id, dto.toStatus, user, {
      paymentReference: dto.paymentReference,
      note: dto.note,
    });
  }
}
