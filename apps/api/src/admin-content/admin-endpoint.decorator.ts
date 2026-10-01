import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/** Controlador del admin: exige access token y se documenta con el candado de Bearer. */
export const AdminController = (tag: string) =>
  applyDecorators(
    ApiTags(`admin · ${tag}`),
    UseGuards(JwtAuthGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Sin access token o token vencido' }),
  );

/** Middleware: las respuestas del admin (incluidos los 401) nunca se cachean. */
export function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

export const jsonSchema = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) as Record<string, unknown>;
export const jsonOutput = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { unrepresentable: 'any' }) as Record<string, unknown>;
