import { NotificationChannel } from '@prisma/client';

/**
 * Notification delivery abstraction (Phase 4, Module 11).
 *
 * The rest of the app enqueues notifications through NotificationsService and
 * never talks to a delivery provider directly. A log-only sender ships for
 * development; an email provider (SES / SendGrid / SMTP) is selected via
 * NOTIFICATION_PROVIDER and implements the same single method — no changes to
 * callers.
 */
export const NOTIFICATION_SENDER = 'NOTIFICATION_SENDER';

export interface NotificationMessage {
  channel: NotificationChannel;
  template: string;
  recipientEmail?: string | null;
  payload?: Record<string, unknown> | null;
}

export interface NotificationSender {
  send(message: NotificationMessage): Promise<void>;
}
