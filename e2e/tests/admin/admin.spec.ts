import { expect, test } from '@playwright/test';
import { expectThemeTogglePersists } from '../theme';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@tamila.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

test('sin sesión, una ruta interna redirige al login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});

test('una URL inexistente muestra la página 404', async ({ page }) => {
  await page.goto('/no-existe');
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
});

test('el modo elegido persiste al recargar', async ({ page }) => {
  await expectThemeTogglePersists(page, '/login');
});

// Un solo login por ejecución: el endpoint permite 5 intentos por minuto por IP.
test('login, panel con carga diferida y logout', async ({ page }) => {
  const dashboardChunks: string[] = [];
  page.on('request', (req) => {
    if (/dashboard/i.test(new URL(req.url()).pathname)) dashboardChunks.push(req.url());
  });

  await page.goto('/login');
  const submit = page.getByRole('button', { name: 'Ingresar' });
  await expect(submit).toBeDisabled();
  expect(dashboardChunks).toHaveLength(0);

  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
  // Turnstile con la site key de prueba se resuelve solo en unos segundos.
  await expect(submit).toBeEnabled({ timeout: 20_000 });
  await submit.click();

  await expect(page.getByRole('heading', { name: 'Panel' })).toBeVisible();
  await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
  expect(dashboardChunks.length).toBeGreaterThan(0);

  // La sesión sobrevive a una recarga (refresh token en cookie HttpOnly).
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Panel' })).toBeVisible();

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/');
  await expect(page).toHaveURL(/\/login$/);
});
