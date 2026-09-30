import { expect, test } from '@playwright/test';
import { expectThemeTogglePersists } from '../theme';

test('el inicio llega renderizado desde el servidor en español', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('<html lang="es"');
  expect(html).toMatch(/<h1[^>]*>TAMILA<\/h1>/);
  expect(html).toMatch(/<title>[^<]+<\/title>/);
});

test('una URL inexistente responde 404 y muestra la página 404', async ({ page }) => {
  const res = await page.goto('/esta-pagina-no-existe');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Página no encontrada' })).toBeVisible();
  await page.getByRole('link', { name: 'Volver al inicio' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('el modo elegido persiste al recargar', async ({ page }) => {
  await expectThemeTogglePersists(page, '/');
});

test('el componente pesado se descarga recién al mostrarlo', async ({ page }) => {
  const chunks: string[] = [];
  page.on('request', (req) => {
    if (req.url().includes('showcase')) chunks.push(req.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(chunks).toHaveLength(0);

  await page.getByRole('button', { name: 'Ver galería' }).click();
  await expect(page.getByTestId('showcase')).toBeVisible();
  expect(chunks.length).toBeGreaterThan(0);
});
