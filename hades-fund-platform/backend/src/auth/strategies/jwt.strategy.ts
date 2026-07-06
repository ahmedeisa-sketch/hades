import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Re-checks the user against the database on every request instead of
   * trusting the JWT payload alone. Without this, deactivating or
   * soft-deleting a user has no effect until their access token naturally
   * expires (up to JWT_ACCESS_EXPIRES_IN later) — a real gap for an admin
   * trying to immediately revoke access (e.g. offboarding, compromised
   * account).
   */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    // Guard against a role change not being reflected until re-login —
    // always trust the current DB role, not the (possibly stale) token claim.
    return { userId: user.id, email: user.email, role: user.role };
  }
}
