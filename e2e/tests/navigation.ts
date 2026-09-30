import type { Page } from '@playwright/test';

/** Navega y espera a que React hidrate antes de interactuar (en dev la hidratación tarda). */
export async function gotoHydrated(page: Page, path: string) {
  const response = await page.goto(path);
  await page.locator('html[data-hydrated="true"]').waitFor();
  return response;
}
