import { describe, expect, it } from 'vitest';
import { authResponseSchema, loginSchema } from './schemas';

describe('loginSchema', () => {
  it('acepta credenciales válidas y normaliza el email', () => {
    const result = loginSchema.parse({ email: '  Admin@Tamila.COM ', password: 'secreta' });
    expect(result).toEqual({ email: 'admin@tamila.com', password: 'secreta' });
  });

  it('exige el email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'x' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('El email es obligatorio');
  });

  it('rechaza un email inválido', () => {
    const result = loginSchema.safeParse({ email: 'no-es-email', password: 'x' });
    expect(result.error?.issues[0]?.message).toBe('Ingresá un email válido');
  });

  it('exige la contraseña', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(result.error?.issues[0]?.path).toEqual(['password']);
    expect(result.error?.issues[0]?.message).toBe('La contraseña es obligatoria');
  });

  it('rechaza campos no permitidos', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'x', rol: 'admin' });
    expect(result.success).toBe(false);
  });

  it('rechaza campos faltantes', () => {
    const result = loginSchema.safeParse({});
    expect(result.error?.issues.map((i) => i.path[0])).toEqual(['email', 'password']);
  });
});

describe('authResponseSchema', () => {
  it('valida la respuesta de login', () => {
    const ok = authResponseSchema.safeParse({
      accessToken: 'jwt',
      expiresIn: 900,
      admin: { id: '1', email: 'a@b.com', createdAt: '2026-09-30T12:00:00.000Z' },
    });
    expect(ok.success).toBe(true);
  });

  it('rechaza una respuesta sin token', () => {
    const bad = authResponseSchema.safeParse({ expiresIn: 900, admin: {} });
    expect(bad.success).toBe(false);
  });
});
