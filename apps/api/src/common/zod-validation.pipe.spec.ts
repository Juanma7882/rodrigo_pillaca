import { BadRequestException } from '@nestjs/common';
import { loginSchema } from '@tamila/shared';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(loginSchema);

  it('devuelve los datos parseados', () => {
    expect(pipe.transform({ email: 'A@B.com', password: 'x' })).toEqual({
      email: 'a@b.com',
      password: 'x',
    });
  });

  it('responde 400 indicando los campos inválidos', () => {
    try {
      pipe.transform({ password: 'x' });
      fail('debería lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const body = (error as BadRequestException).getResponse() as {
        errors: Array<{ field: string }>;
      };
      expect(body.errors).toEqual([{ field: 'email', message: 'El email es obligatorio' }]);
    }
  });

  it('rechaza campos no permitidos con mensaje en español', () => {
    try {
      pipe.transform({ email: 'a@b.com', password: 'x', rol: 'admin' });
      fail('debería lanzar');
    } catch (error) {
      const body = (error as BadRequestException).getResponse() as {
        errors: Array<{ message: string }>;
      };
      expect(body.errors[0]?.message).toMatch(/rol/);
      expect(body.errors[0]?.message).not.toMatch(/Unrecognized/);
    }
  });
});
