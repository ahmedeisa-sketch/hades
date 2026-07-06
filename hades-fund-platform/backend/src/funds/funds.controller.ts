import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { FundsService } from './funds.service';
import { CreateFundDto } from './dto/create-fund.dto';
import { CreateNavSnapshotDto } from './dto/create-nav-snapshot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('funds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('funds')
export class FundsController {
  constructor(private readonly fundsService: FundsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateFundDto) {
    return this.fundsService.create(dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.FINANCE,
    UserRole.RELATIONSHIP_MANAGER,
  )
  findAll() {
    return this.fundsService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.FINANCE,
    UserRole.RELATIONSHIP_MANAGER,
  )
  findOne(@Param('id') id: string) {
    return this.fundsService.findOne(id);
  }

  @Get(':id/nav')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.FINANCE,
    UserRole.RELATIONSHIP_MANAGER,
  )
  listNav(@Param('id') id: string) {
    return this.fundsService.listNav(id);
  }

  @Get(':id/nav/latest')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.FINANCE,
    UserRole.RELATIONSHIP_MANAGER,
  )
  latestNav(@Param('id') id: string) {
    return this.fundsService.getLatestNav(id);
  }

  // NAV entry is a Finance/PM/Portfolio responsibility — not Operations.
  @Post(':id/nav')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PORTFOLIO_MANAGER, UserRole.FINANCE)
  createNav(
    @Param('id') id: string,
    @Body() dto: CreateNavSnapshotDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fundsService.createNav(id, dto, user.userId);
  }
}
