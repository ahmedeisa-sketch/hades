import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationMessage,
  NotificationSender,
} from '../notification-sender.interface';

/**
 * Email delivery placeholder, selected when NOTIFICATION_PROVIDER=email.
 *
 * Intentionally a documented stub so the notification pipeline and templates
 * ship and are exercised against the log sender now, while production email
 * integration is a single, well-scoped file to complete.
 *
 * To finish this:
 *   1. `npm i @aws-sdk/client-ses` (or nodemailer / @sendgrid/mail)
 *   2. Construct the client from env (region / API key / SMTP config)
 *   3. Map `template` + `payload` to a subject/body (or a provider template id)
 *      and send to `recipientEmail`.
 * NotificationsService depends only on the NotificationSender interface, so no
 * caller changes are required.
 */
@Injectable()
export class EmailNotificationSender implements NotificationSender {
  private readonly logger = new Logger('Notifications');

  async send(message: NotificationMessage): Promise<void> {
    if (!message.recipientEmail) {
      // Nothing to deliver to; treat as a no-op rather than a hard failure.
      return;
    }
    // Not yet wired to a provider — surface loudly so it isn't mistaken for
    // real delivery in a misconfigured environment.
    this.logger.warn(
      `EmailNotificationSender is a stub: "${message.template}" was NOT emailed to ` +
        `${message.recipientEmail}. Set NOTIFICATION_PROVIDER=log for dev, or complete ` +
        `email-notification.sender.ts.`,
    );
    throw new Error('Email notification provider is not configured');
  }
}
