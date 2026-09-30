import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Credenciales del admin y URLs desde el .env de la raíz (en CI vienen del entorno).
const rootEnv = resolve(import.meta.dirname, '../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const WEB_URL = process.env.E2E_WEB_URL ?? `http://localhost:${process.env.WEB_PORT ?? 4173}`;
const ADMIN_URL = process.env.E2E_ADMIN_URL ?? `http://localhost:${process.env.ADMIN_PORT ?? 4174}`;

/**
 * Corre contra el stack ya levantado (pnpm dev:up o el stack de CI).
 * El login del admin usa las claves de prueba de Cloudflare Turnstile, que siempre pasan.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'on-first-retry',
    locale: 'es-AR',
  },
  projects: [
    {
      name: 'web',
      testDir: './tests/web',
      use: { ...devices['Desktop Chrome'], baseURL: WEB_URL },
    },
    {
      name: 'admin',
      testDir: './tests/admin',
      use: { ...devices['Desktop Chrome'], baseURL: ADMIN_URL },
    },
  ],
});
