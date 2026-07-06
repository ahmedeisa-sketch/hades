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
import { InvestorStatus, UserRole } from '@prisma/client';
import { InvestorsService } from './investors.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { UpdateComplianceDto } from './dto/update-compliance.dto';
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
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('status') status?: InvestorStatus,
    @Query('relationshipManagerId') relationshipManagerId?: string,
  ) {
    return this.investorsService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      status,
      relationshipManagerId,
    });
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
    @Body() body: { toStage: InvestorStatus; note?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investorsService.transitionStage(id, body.toStage, user.userId, body.note);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.investorsService.softDelete(id, user.userId);
  }
}
