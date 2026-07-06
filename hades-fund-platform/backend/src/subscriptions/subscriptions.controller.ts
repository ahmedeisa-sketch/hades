import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('investors/:investorId/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.FINANCE)
  create(
    @Param('investorId') investorId: string,
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.subscriptionsService.create(investorId, dto, user.userId);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS,
    UserRole.FINANCE,
    UserRole.PORTFOLIO_MANAGER,
    UserRole.RELATIONSHIP_MANAGER,
    UserRole.COMPLIANCE_OFFICER,
  )
  list(@Param('investorId') investorId: string) {
    return this.subscriptionsService.listForInvestor(investorId);
  }

  @Delete(':subscriptionId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  remove(@Param('subscriptionId') subscriptionId: string) {
    return this.subscriptionsService.softDelete(subscriptionId);
  }
}
