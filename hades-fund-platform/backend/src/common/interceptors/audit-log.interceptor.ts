import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Writes an AuditLog row for every mutating request (POST/PATCH/PUT/DELETE)
 * that completes successfully. Controllers can attach richer before/after
 * values via `request.auditContext` (set old/new value, entity type, id).
 *
 * This gives Module 10 (Audit Trail) coverage by default without every
 * controller having to remember to log manually.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const mutatingMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];

    if (!mutatingMethods.includes(request.method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        const auditContext = request.auditContext ?? {};
        try {
          await this.prisma.auditLog.create({
            data: {
              userId: request.user?.userId ?? null,
              action: auditContext.action ?? request.method,
              entityType: auditContext.entityType ?? request.route?.path ?? 'unknown',
              entityId: auditContext.entityId ?? null,
              oldValue: auditContext.oldValue ?? undefined,
              newValue: auditContext.newValue ?? undefined,
              ipAddress: request.ip,
            },
          });
        } catch {
          // Audit logging must never break the primary request.
          // In production, wire this to an alerting/observability pipeline.
        }
      }),
    );
  }
}
