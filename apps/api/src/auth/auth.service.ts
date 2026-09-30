import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AdminProfile, AuthResponse } from '@tamila/shared';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { ENV, type Env } from '../config/env';
import type { AdminUser } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AccessTokenPayload } from './auth.types';
import { PasswordService } from './password.service';

export type Session = AuthResponse & { refreshToken: string; refreshExpiresAt: Date };

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passwords: PasswordService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async login(email: string, password: string): Promise<Session> {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    const valid = admin
      ? await this.passwords.verify(admin.passwordHash, password)
      : await this.passwords.verifyDummy(password);
    // Mismo mensaje para email inexistente y contraseña incorrecta.
    if (!admin || !valid) throw new UnauthorizedException('Email o contraseña incorrectos');
    return this.createSession(admin, randomUUID());
  }

  async refresh(rawToken: string | undefined): Promise<Session> {
    if (!rawToken) throw new UnauthorizedException('Sesión inválida o vencida');
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: { adminUser: true },
    });
    if (!stored) throw new UnauthorizedException('Sesión inválida o vencida');

    if (stored.revokedAt || stored.replacedById) {
      await this.revokeAllSessions(stored.adminUserId, 'reutilización de refresh token');
      throw new UnauthorizedException('Sesión inválida o vencida');
    }
    if (stored.expiresAt <= new Date())
      throw new UnauthorizedException('Sesión inválida o vencida');

    // Reclamo atómico: si dos requests usan el mismo token a la vez, solo una gana.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (claimed.count === 0) {
      await this.revokeAllSessions(
        stored.adminUserId,
        'reutilización concurrente de refresh token',
      );
      throw new UnauthorizedException('Sesión inválida o vencida');
    }

    const session = await this.createSession(stored.adminUser, stored.familyId);
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedById: session.refreshTokenId },
    });
    return session;
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(rawToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async profile(adminId: string): Promise<AdminProfile> {
    const admin = await this.prisma.adminUser.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('No autenticado');
    return this.toProfile(admin);
  }

  private async revokeAllSessions(adminUserId: string, reason: string) {
    this.logger.warn(`Se revocan todas las sesiones del admin ${adminUserId}: ${reason}`);
    await this.prisma.refreshToken.updateMany({
      where: { adminUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async createSession(
    admin: AdminUser,
    familyId: string,
  ): Promise<Session & { refreshTokenId: string }> {
    const refreshToken = randomBytes(32).toString('base64url');
    const refreshExpiresAt = new Date(Date.now() + this.env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
    const created = await this.prisma.refreshToken.create({
      data: {
        adminUserId: admin.id,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt: refreshExpiresAt,
      },
    });
    const payload: AccessTokenPayload = { sub: admin.id, email: admin.email };
    const accessToken = await this.jwt.signAsync(payload);
    return {
      accessToken,
      expiresIn: this.env.JWT_ACCESS_TTL_SECONDS,
      admin: this.toProfile(admin),
      refreshToken,
      refreshExpiresAt,
      refreshTokenId: created.id,
    };
  }

  private toProfile(admin: AdminUser): AdminProfile {
    return { id: admin.id, email: admin.email, createdAt: admin.createdAt.toISOString() };
  }
}
