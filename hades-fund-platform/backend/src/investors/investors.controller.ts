import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { InvestorsService } from './investors.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
import { QueryInvestorsDto } from './dto/query-investors.dto';
import { TransitionStageDto } from './dto/transition-stage.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('investors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('investors')
export class InvestorsController {
  constructor(private readonly investorsService: InvestorsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.RELATIONSHIP_MANAGER)
  create(@Body() dto: CreateInvestorDto, @CurrentUser() user: AuthenticatedUser) {
    return this.investorsService.create(dto, user.userId);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.FINANCE,
  )
  findAll(@Query() query: QueryInvestorsDto) {
    return this.investorsService.findAll(query);
  }

  /**
   * Lightweight relationship-manager picklist for the "Assign RM" dropdown
   * on investor create/edit forms. Deliberately open to every role that can
   * create/update an investor (not just SUPER_ADMIN, unlike /users) and
   * returns only id/fullName — no email, role, or other account details.
   */
  @Get('relationship-managers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.RELATIONSHIP_MANAGER)
  listRelationshipManagers() {
    return this.investorsService.listRelationshipManagers();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.FINANCE,
  )
  findOne(@Param('id') id: string) {
    return this.investorsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.RELATIONSHIP_MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvestorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investorsService.update(id, dto, user.userId);
  }

  @Patch(':id/compliance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER)
  updateCompliance(
    @Param('id') id: string,
    @Body() dto: UpdateComplianceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investorsService.updateCompliance(id, dto, user.userId);
  }

  @Patch(':id/stage')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.COMPLIANCE_OFFICER,
    UserRole.PORTFOLIO_MANAGER,
  )
  transitionStage(
    @Param('id') id: string,
    @Body() dto: TransitionStageDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investorsService.transitionStage(id, dto.toStage, user.userId, dto.note);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.investorsService.softDelete(id, user.userId);
  }
}
