import { BadRequestException, PipeTransform } from '@nestjs/common';
import { configureZodEs } from '@tamila/shared';
import type { z } from 'zod';

configureZodEs();

export type FieldError = { field: string; message: string };

/** Valida con un esquema Zod compartido y responde 400 con la lista de campos inválidos. */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    const errors: FieldError[] = result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw new BadRequestException({ message: 'Los datos enviados no son válidos', errors });
  }
}
