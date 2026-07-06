import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NOTIFICATION_SENDER } from './notification-sender.interface';
import { LogNotificationSender } from './senders/log-notification.sender';
import { EmailNotificationSender } from './senders/email-notification.sender';

/**
 * Global so any feature service (investors, redemptions, distributions, …)
 * can inject NotificationsService without importing this module. The active
 * sender is chosen at boot from NOTIFICATION_PROVIDER (default: log).
 */
@Global()
@Module({
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    LogNotificationSender,
    EmailNotificationSender,
    {
      provide: NOTIFICATION_SENDER,
      inject: [LogNotificationSender, EmailNotificationSender],
      useFactory: (log: LogNotificationSender, email: EmailNotificationSender) => {
        const provider = (process.env.NOTIFICATION_PROVIDER ?? 'log').toLowerCase();
        return provider === 'email' ? email : log;
      },
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
