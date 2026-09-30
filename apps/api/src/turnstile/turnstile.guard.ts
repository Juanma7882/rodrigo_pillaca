import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { ApiForbiddenResponse, ApiSecurity } from '@nestjs/swagger';
import { TURNSTILE_HEADER } from '@tamila/shared';
import type { Request } from 'express';
import { TurnstileService } from './turnstile.service';

@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstile: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.header(TURNSTILE_HEADER);
    if (await this.turnstile.verify(token, request.ip)) return true;
    throw new ForbiddenException(
      'No pudimos verificar que no seas un robot. Recargá la página e intentá de nuevo.',
    );
  }
}

/** Exige un token válido de Cloudflare Turnstile en el header `cf-turnstile-response`. */
export const RequireTurnstile = () =>
  applyDecorators(
    UseGuards(TurnstileGuard),
    ApiSecurity('turnstile'),
    ApiForbiddenResponse({ description: 'Token de Turnstile ausente o inválido' }),
  );
