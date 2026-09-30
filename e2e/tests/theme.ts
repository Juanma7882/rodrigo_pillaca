import { expect, type Page } from '@playwright/test';

/** Cambia el tema con el botón y verifica que la elección sobrevive a una recarga sin parpadeo. */
export async function expectThemeTogglePersists(page: Page, path: string) {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(path);
  const html = page.locator('html');
  await expect(html).toHaveClass(/dark/);

  await page.getByRole('button', { name: 'Cambiar a modo claro' }).click();
  await expect(html).not.toHaveClass(/dark/);

  // El script inline aplica el tema antes del primer render: se verifica apenas llega el HTML.
  await page.reload({ waitUntil: 'commit' });
  await page.waitForLoadState('domcontentloaded');
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(
    false,
  );
  await expect(page.getByRole('button', { name: 'Cambiar a modo oscuro' })).toBeVisible();
}
