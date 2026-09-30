import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AccessTokenPayload, AuthenticatedAdmin } from './auth.types';

export type AuthenticatedRequest = Request & { admin: AuthenticatedAdmin };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.header('authorization')?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('No autenticado');
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      request.admin = { id: payload.sub, email: payload.email };
      return true;
    } catch {
      throw new UnauthorizedException('La sesión venció o no es válida');
    }
  }
}
