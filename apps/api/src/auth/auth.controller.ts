import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  adminProfileSchema,
  authResponseSchema,
  type AdminProfile,
  type AuthResponse,
  type LoginInput,
  loginSchema,
} from '@tamila/shared';
import type { CookieOptions, Request, Response } from 'express';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RequireTurnstile } from '../turnstile/turnstile.guard';
import { AuthService, type Session } from './auth.service';
import { REFRESH_COOKIE, REFRESH_COOKIE_PATH, type AuthenticatedAdmin } from './auth.types';
import { CurrentAdmin } from './current-admin.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: REFRESH_COOKIE_PATH,
};

const jsonSchema = (schema: z.ZodType) => z.toJSONSchema(schema) as Record<string, unknown>;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @RequireTurnstile()
  @ApiBody({ schema: jsonSchema(loginSchema) })
  @ApiOkResponse({ schema: jsonSchema(authResponseSchema) })
  @ApiUnauthorizedResponse({ description: 'Email o contraseña incorrectos' })
  @ApiTooManyRequestsResponse({ description: 'Demasiados intentos' })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    return this.respond(res, await this.auth.login(body.email, body.password));
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ schema: jsonSchema(authResponseSchema) })
  @ApiUnauthorizedResponse({
    description: 'Refresh token ausente, vencido, revocado o reutilizado',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponse> {
    try {
      return this.respond(res, await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]));
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, cookieOptions);
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Sesión cerrada' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, cookieOptions);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ schema: jsonSchema(adminProfileSchema) })
  @ApiUnauthorizedResponse({ description: 'Sin access token o token inválido' })
  me(@CurrentAdmin() admin: AuthenticatedAdmin): Promise<AdminProfile> {
    return this.auth.profile(admin.id);
  }

  private respond(res: Response, session: Session): AuthResponse {
    res.cookie(REFRESH_COOKIE, session.refreshToken, {
      ...cookieOptions,
      expires: session.refreshExpiresAt,
    });
    return { accessToken: session.accessToken, expiresIn: session.expiresIn, admin: session.admin };
  }
}
