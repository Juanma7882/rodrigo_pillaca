import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { envSchema, parseEnv, type Env } from '@tamila/shared';

export const ENV = Symbol('ENV');
export type { Env };

/** Carga el .env de la raíz del monorepo si existe (en Docker las variables vienen del entorno). */
export function loadDotEnv(): void {
  const file = resolve(__dirname, '../../../../.env');
  const fallback = resolve(process.cwd(), '../../.env');
  const path = [file, fallback].find((candidate) => existsSync(candidate));
  if (path) process.loadEnvFile(path);
}

export function readEnv(): Env {
  return parseEnv(envSchema, process.env);
}
