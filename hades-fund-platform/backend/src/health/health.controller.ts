import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unauthenticated liveness/readiness probe for docker-compose, load
 * balancers, and orchestrators. Previously there was no way to tell
 * whether the backend container was actually able to serve traffic
 * (only postgres had a healthcheck in docker-compose.yml) — compose could
 * report the stack as "up" seconds before the API could handle a real
 * request.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'up', timestamp: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
