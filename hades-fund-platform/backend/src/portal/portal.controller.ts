import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

/**
 * All routes are gated to the INVESTOR role and scoped, in the service, to
 * the caller's own linked investor record.
 */
@ApiTags('portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INVESTOR)
@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('me')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getProfile(user.userId);
  }

  @Get('statement')
  getStatement(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getStatement(user.userId);
  }

  @Get('subscriptions')
  getSubscriptions(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getSubscriptions(user.userId);
  }

  @Get('distributions')
  getDistributions(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getDistributions(user.userId);
  }

  @Get('redemptions')
  getRedemptions(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getRedemptions(user.userId);
  }

  @Get('documents')
  getDocuments(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getDocuments(user.userId);
  }
}
