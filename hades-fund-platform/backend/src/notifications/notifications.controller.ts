import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Every authenticated user can read their own notifications.
  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listForUser(user.userId);
  }

  // Admin/compliance/ops oversight of the whole notification log.
  @Get('all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPLIANCE_OFFICER, UserRole.OPERATIONS)
  listAll() {
    return this.notificationsService.listAll();
  }
}
