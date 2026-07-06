import { Inject, Injectable } from '@nestjs/common';
import { NotificationChannel, NotificationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  NOTIFICATION_SENDER,
  NotificationSender,
} from './notification-sender.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(NOTIFICATION_SENDER) private readonly sender: NotificationSender,
  ) {}

  /**
   * Records a notification (PENDING), attempts delivery through the configured
   * sender, and marks it SENT or FAILED. Delivery never throws to the caller —
   * a failed notification must not roll back the business action that
   * triggered it (an approval, a payment, etc.).
   */
  async enqueue(params: {
    userId?: string | null;
    channel?: NotificationChannel;
    template: string;
    payload?: Prisma.InputJsonValue;
  }) {
    const channel = params.channel ?? NotificationChannel.EMAIL;

    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId ?? undefined,
        channel,
        template: params.template,
        payload: params.payload,
        status: NotificationStatus.PENDING,
      },
    });

    try {
      const recipientEmail = params.userId
        ? (
            await this.prisma.user.findUnique({
              where: { id: params.userId },
              select: { email: true },
            })
          )?.email ?? null
        : null;

      await this.sender.send({
        channel,
        template: params.template,
        recipientEmail,
        payload: (params.payload as unknown as Record<string, unknown>) ?? null,
      });

      return this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });
    } catch {
      return this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });
    }
  }

  /**
   * Convenience wrapper: resolve an investor's linked portal user and notify
   * them. Still records the notification if the investor has no portal account
   * yet (userId null), so nothing is silently lost.
   */
  async notifyInvestor(investorId: string, template: string, payload?: Prisma.InputJsonValue) {
    const investor = await this.prisma.investor.findUnique({
      where: { id: investorId },
      select: { portalUserId: true },
    });
    return this.enqueue({ userId: investor?.portalUserId ?? null, template, payload });
  }

  listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  listAll() {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
  }
}
