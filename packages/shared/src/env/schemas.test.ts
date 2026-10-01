import { describe, expect, it } from 'vitest';
import { envSchema, parseEnv, seedEnvSchema } from './schemas';

const validEnv = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  CORS_ORIGINS: 'http://localhost:5173, http://localhost:5174',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  TURNSTILE_SECRET_KEY: 'secret',
};

describe('envSchema', () => {
  it('aplica valores por defecto y parsea la lista de orígenes', () => {
    const env = parseEnv(envSchema, validEnv);
    expect(env.API_PORT).toBe(3000);
    expect(env.NODE_ENV).toBe('development');
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:5173', 'http://localhost:5174']);
  });

  it('nombra la variable faltante', () => {
    const { JWT_ACCESS_SECRET: _omit, ...rest } = validEnv;
    expect(() => parseEnv(envSchema, rest)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rechaza un secreto JWT corto', () => {
    expect(() => parseEnv(envSchema, { ...validEnv, JWT_ACCESS_SECRET: 'corto' })).toThrow(
      /al menos 32 caracteres/,
    );
  });

  it('guarda los originales fuera de la carpeta pública por defecto', () => {
    const env = parseEnv(envSchema, validEnv);
    expect([env.MEDIA_DIR, env.MEDIA_ORIGINALS_DIR]).toEqual(['./media', './media-originals']);
  });

  it('no permite los originales dentro de MEDIA_DIR', () => {
    for (const MEDIA_ORIGINALS_DIR of ['./media/originals', 'media', '/data/media/orig']) {
      const MEDIA_DIR = MEDIA_ORIGINALS_DIR.startsWith('/') ? '/data/media/' : './media';
      expect(() => parseEnv(envSchema, { ...validEnv, MEDIA_DIR, MEDIA_ORIGINALS_DIR })).toThrow(
        /MEDIA_ORIGINALS_DIR/,
      );
    }
    expect(() =>
      parseEnv(envSchema, {
        ...validEnv,
        MEDIA_DIR: '/data/media',
        MEDIA_ORIGINALS_DIR: '/data/media-originals',
      }),
    ).not.toThrow();
  });

  it('rechaza un origen CORS que no es URL', () => {
    expect(() => parseEnv(envSchema, { ...validEnv, CORS_ORIGINS: 'no-url' })).toThrow(
      /CORS_ORIGINS/,
    );
  });
});

describe('seedEnvSchema', () => {
  it('exige una contraseña de admin larga', () => {
    expect(() =>
      parseEnv(seedEnvSchema, { ADMIN_EMAIL: 'a@b.com', ADMIN_PASSWORD: 'corta' }),
    ).toThrow(/ADMIN_PASSWORD/);
  });
});
