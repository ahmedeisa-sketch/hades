import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvestorsModule } from './investors/investors.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { DocumentsModule } from './documents/documents.module';
import { FundsModule } from './funds/funds.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ComplianceModule } from './compliance/compliance.module';
import { HoldingsModule } from './holdings/holdings.module';
import { DistributionsModule } from './distributions/distributions.module';
import { RedemptionsModule } from './redemptions/redemptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PortalModule } from './portal/portal.module';
import { ReportingModule } from './reporting/reporting.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]), // 120 req/min per IP by default
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    InvestorsModule,
    DashboardModule,
    HealthModule,
    // Phase 2: Compliance & documents
    DocumentsModule,
    FundsModule,
    SubscriptionsModule,
    ComplianceModule,
    // Phase 3: Money movement
    HoldingsModule,
    DistributionsModule,
    RedemptionsModule,
    // Phase 4: Investor-facing & reporting
    NotificationsModule, // @Global — injectable by the workflow modules above
    PortalModule,
    ReportingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
