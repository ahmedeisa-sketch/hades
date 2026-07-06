import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationMessage,
  NotificationSender,
} from '../notification-sender.interface';

/**
 * Default sender for development / docker-compose: writes the notification to
 * the application log instead of delivering it. Lets the whole notification
 * pipeline (enqueue -> send -> mark SENT) be exercised without a real email
 * provider configured.
 */
@Injectable()
export class LogNotificationSender implements NotificationSender {
  private readonly logger = new Logger('Notifications');

  async send(message: NotificationMessage): Promise<void> {
    this.logger.log(
      `[${message.channel}] ${message.template} -> ${message.recipientEmail ?? 'no-recipient'} ` +
        `${message.payload ? JSON.stringify(message.payload) : ''}`,
    );
  }
}
