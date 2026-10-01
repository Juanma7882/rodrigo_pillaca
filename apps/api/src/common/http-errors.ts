import { BadRequestException, ConflictException } from '@nestjs/common';
import type { FieldError } from './zod-validation.pipe';

/** 400 con el mismo formato que las validaciones de Zod, para errores detectados en el servicio. */
export function fieldError(field: string, message: string): BadRequestException {
  const errors: FieldError[] = [{ field, message }];
  return new BadRequestException({ message: 'Los datos enviados no son válidos', errors });
}

/** Traduce una violación de unicidad de Prisma (P2002) a 409; cualquier otro error se relanza. */
export function prismaConflict(error: unknown, message: string): never {
  if ((error as { code?: string }).code === 'P2002') throw new ConflictException(message);
  throw error;
}
