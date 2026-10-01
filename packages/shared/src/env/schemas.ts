import { z } from 'zod';

const csv = z
  .string()
  .transform((value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )
  .pipe(z.array(z.url()).min(1));

const normalizePath = (path: string) => path.replace(/^\.\//, '').replace(/\/+$/, '');

/** Los originales no pueden quedar dentro de MEDIA_DIR: todo lo que está ahí se publica. */
const isInside = (child: string, parent: string) => {
  const [c, p] = [normalizePath(child), normalizePath(parent)];
  return c === p || c.startsWith(`${p}/`);
};

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DATABASE_URL: z.url({ error: 'DATABASE_URL debe ser una URL de conexión válida' }),
  API_PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: csv,
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  JWT_ACCESS_SECRET: z
    .string({ error: 'JWT_ACCESS_SECRET es obligatoria' })
    .min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),
  TURNSTILE_SECRET_KEY: z.string({ error: 'TURNSTILE_SECRET_KEY es obligatoria' }).min(1),
  /** Carpeta donde se guardan las imágenes (volumen persistente en Docker). */
  MEDIA_DIR: z.string().min(1).default('./media'),
  /** Originales de las imágenes subidas (privados: para re-optimizar). Nunca bajo MEDIA_DIR. */
  MEDIA_ORIGINALS_DIR: z.string().min(1).default('./media-originals'),
});

export const envSchema = baseEnvSchema.refine(
  (env) => !isInside(env.MEDIA_ORIGINALS_DIR, env.MEDIA_DIR),
  {
    path: ['MEDIA_ORIGINALS_DIR'],
    message: 'MEDIA_ORIGINALS_DIR no puede estar dentro de MEDIA_DIR (quedaría público)',
  },
);
export type Env = z.infer<typeof envSchema>;

export const seedEnvSchema = z.object({
  ADMIN_EMAIL: z.email({ error: 'ADMIN_EMAIL debe ser un email válido' }),
  ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD debe tener al menos 12 caracteres'),
});

/** Valida el entorno y devuelve un error legible que nombra cada variable inválida. */
export function parseEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, unknown>,
): z.infer<T> {
  const result = schema.safeParse(source);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Variables de entorno inválidas:\n${lines.join('\n')}`);
}
