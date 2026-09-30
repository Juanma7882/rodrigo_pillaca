import { expect, test } from '@playwright/test';
import { gotoHydrated } from '../navigation';
import { expectThemeTogglePersists } from '../theme';

const SERVICES = [
  'Durlock',
  'Steelframe',
  'Pintura',
  'Pisos flotantes y de madera',
  'Pulido de pisos',
  'Plomería',
  'Electricidad',
  'Gas',
];

test('el inicio llega renderizado desde el servidor, en español y con SEO', async ({ request }) => {
  const res = await request.get('/');
  expect(res.status()).toBe(200);
  const html = await res.text();
  expect(html).toContain('<html lang="es"');
  expect(html).toMatch(/<h1[^>]*>[^<]+<\/h1>/);
  for (const name of SERVICES) expect(html).toContain(name);
  expect(html).not.toMatch(/aire acondicionado/i);
  expect(html).toContain('rel="canonical"');
  expect(html).toContain('"@type":"HomeAndConstructionBusiness"');
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

test('la navbar lleva a las secciones del inicio', async ({ page }) => {
  await gotoHydrated(page, '/');
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Cómo trabajamos' })
    .click();
  await expect(page).toHaveURL(/#como-trabajamos$/);
  await expect(page.getByRole('heading', { name: 'Cómo trabajamos' })).toBeInViewport();
});

test('la navbar queda fija y visible al hacer scroll', async ({ page }) => {
  await gotoHydrated(page, '/');
  const header = page.getByRole('banner');
  for (const y of [1500, 6000, 800]) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await expect(header).toBeInViewport();
    expect((await header.boundingBox())?.y).toBe(0);
  }
});

test('desde otra página, "Preguntas" vuelve al inicio en esa sección', async ({ page }) => {
  await gotoHydrated(page, '/servicios/durlock');
  await page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Preguntas' })
    .click();
  await expect(page).toHaveURL(/\/#preguntas$/);
  await expect(page.getByRole('heading', { name: 'Preguntas frecuentes' })).toBeInViewport();
});

test.describe('en el celular', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('el menú móvil navega y se cierra', async ({ page }) => {
    await gotoHydrated(page, '/');
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    const menu = page.getByRole('dialog', { name: 'Menú' });
    await menu.getByRole('link', { name: /Servicios/ }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Contenido' })).toBeInViewport();
  });

  test('el menú se abre como modal sin desplazar la página y se cierra tocando el fondo', async ({
    page,
  }) => {
    await gotoHydrated(page, '/');
    await page.evaluate(() => window.scrollTo(0, 1200));
    const heading = page.getByRole('heading', { name: 'Contenido' });
    const before = await heading.boundingBox();
    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await expect(page.getByRole('dialog', { name: 'Menú' })).toBeVisible();
    expect(await heading.boundingBox()).toEqual(before);
    expect(await page.evaluate(() => window.scrollY)).toBe(1200);
    // Toque en la franja de fondo visible a la izquierda del panel (el body tiene el scroll bloqueado).
    await page.mouse.click(10, 400);
    await expect(page.getByRole('dialog', { name: 'Menú' })).toBeHidden();
  });

  test('no hay scroll horizontal', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBe(0);
  });
});

test('el índice lleva al capítulo y la portada cambia al pasar el mouse', async ({ page }) => {
  await gotoHydrated(page, '/');
  const index = page.locator('#servicios');
  const caption = index.getByRole('figure').locator('figcaption');
  await expect(caption).toContainText('Durlock');

  await index.getByRole('link', { name: /Plomería/ }).hover();
  await expect(caption).toContainText('Plomería');

  await index.getByRole('link', { name: /Pintura/ }).click();
  await expect(page.getByRole('heading', { level: 2, name: 'Pintura' })).toBeInViewport();
});

test('los botones de WhatsApp abren la conversación con el mensaje del servicio', async ({
  page,
}) => {
  await page.goto('/');
  const cta = page.getByRole('link', { name: 'Consultar por Plomería' });
  const href = await cta.getAttribute('href');
  expect(href).toMatch(/^https:\/\/wa\.me\/\d+\?text=/);
  expect(decodeURIComponent(href!.split('text=')[1]!)).toBe('Hola, quiero consultar por Plomería');
  await expect(cta).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('link', { name: 'Escribinos por WhatsApp' }).first()).toBeVisible();
});

test('la página de un servicio tiene su capítulo, sus vecinos y su SEO', async ({ page }) => {
  const res = await gotoHydrated(page, '/servicios/steelframe');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle('Steelframe · TAMILA');
  await expect(page.getByRole('heading', { level: 1, name: 'Steelframe' })).toBeVisible();
  const pager = page.getByRole('navigation', { name: 'Otros servicios' });
  await expect(pager.getByRole('link', { name: /Durlock/ })).toBeVisible();
  await pager.getByRole('link', { name: /Pintura/ }).click();
  await expect(page).toHaveURL(/\/servicios\/pintura$/);

  expect((await page.request.get('/servicios/no-existe')).status()).toBe(404);
});

test('el comparador antes/después se descarga recién al llegar a los trabajos', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (req) => {
    if (/BeforeAfter/.test(req.url())) requested.push(req.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(requested).toHaveLength(0);

  await page.locator('#trabajos').scrollIntoViewIfNeeded();
  const slider = page.getByRole('slider').first();
  await expect(slider).toBeVisible();
  expect(requested.length).toBeGreaterThan(0);
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveAttribute('aria-valuetext', '55% antes, 45% después');
});

test.describe('con movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('las secciones aparecen sin animación', async ({ page }) => {
    await page.goto('/');
    const durations = await page.$$eval('[data-reveal]', (els) =>
      els.map((el) => getComputedStyle(el).transitionDuration),
    );
    expect(durations.length).toBeGreaterThan(0);
    expect(durations.every((d) => d === '0s')).toBe(true);
    const hidden = await page.$$eval(
      '[data-reveal]',
      (els) => els.filter((el) => getComputedStyle(el).opacity !== '1').length,
    );
    expect(hidden).toBe(0);
  });
});
