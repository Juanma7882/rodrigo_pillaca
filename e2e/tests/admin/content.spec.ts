import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@tamila.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

/**
 * Flujos de edición del panel. Corren en serie sobre una sola página con una sola sesión: la
 * API rota el refresh token en cada uso y detecta reutilizaciones, así que no se puede compartir
 * la cookie entre contextos; además el login admite 5 intentos por minuto.
 * Cada test crea sus propios datos y los borra (o restaura lo que cambió).
 */
test.describe.configure({ mode: 'serial' });

let page: Page;
/** Requests hechos por la página desde el login (para verificar la carga diferida). */
const requested: string[] = [];

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  page.on('request', (req) => requested.push(new URL(req.url()).pathname));

  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_EMAIL);
  await page.getByLabel('Contraseña').fill(ADMIN_PASSWORD);
  const submit = page.getByRole('button', { name: 'Ingresar' });
  // Turnstile con la site key de prueba se resuelve solo en unos segundos.
  await expect(submit).toBeEnabled({ timeout: 20_000 });
  await submit.click();
  await expect(page.getByRole('heading', { name: 'Panel' })).toBeVisible();
});

test.afterAll(() => page.close());

/** Navega dentro del panel con el menú lateral (sin recargar: la sesión vive en memoria). */
async function openSection(name: string) {
  await page
    .getByRole('navigation', { name: 'Menú principal' })
    .getByRole('link', { name })
    .click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

test('el inicio del panel no descarga la librería de arrastrar y soltar', async () => {
  await expect(page.getByText(/de \d+ publicados/)).toBeVisible();
  // La implementación (no el envoltorio LazySortableList) y los paquetes de @dnd-kit.
  expect(requested.filter((path) => /\/SortableList[.-]|dnd-kit/i.test(path))).toEqual([]);
});

test('editar el WhatsApp se refleja en la API pública', async () => {
  await openSection('Configuración');
  const whatsapp = page.getByLabel('WhatsApp', { exact: true });
  const original = await whatsapp.inputValue();
  const replacement = original === '5491199998888' ? '5491177776666' : '5491199998888';

  try {
    await whatsapp.fill(replacement);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Cambios guardados')).toBeVisible();

    const site = await page.request.get(`${API_URL}/api/public/site`);
    expect((await site.json()).settings.whatsappNumber).toBe(replacement);
  } finally {
    await whatsapp.fill(original);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByLabel('WhatsApp', { exact: true })).toHaveValue(original);
  }
});

test('crear una pregunta, moverla con el teclado y borrarla', async () => {
  test.setTimeout(60_000);
  await openSection('Preguntas frecuentes');
  const question = `¿Pregunta de prueba ${Date.now()}?`;
  const newForm = page.getByRole('form', { name: 'Agregar pregunta' });
  await newForm.getByLabel('Pregunta', { exact: true }).fill(question);
  await newForm.getByLabel('Respuesta').fill('Respuesta de prueba.');
  await newForm.getByRole('button', { name: 'Agregar pregunta' }).click();

  const list = page.getByRole('list', { name: 'Preguntas' });
  const questions = () =>
    list
      .getByLabel('Pregunta', { exact: true })
      .evaluateAll((inputs) => inputs.map((i) => (i as HTMLInputElement).value));
  await expect.poll(async () => (await questions()).at(-1)).toBe(question);

  try {
    const reorder = page.waitForResponse(
      (res) => res.url().endsWith('/api/admin/faqs/order') && res.request().method() === 'PUT',
    );
    const handle = list.getByRole('button', { name: `Mover ${question}` });
    const total = (await questions()).length;
    await handle.focus();
    await page.keyboard.press('Space');
    // dnd-kit mide la lista al tomar el elemento: se espera antes de mover y antes de soltar.
    await expect(handle).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ArrowUp');
    await expect(
      page.getByRole('status').filter({ hasText: `posición ${total - 1} de ${total}` }),
    ).toBeAttached();
    await page.keyboard.press('Space');
    expect((await reorder).ok()).toBe(true);
    await expect.poll(async () => (await questions()).at(-2)).toBe(question);
  } finally {
    const row = list
      .getByRole('form')
      .filter({ has: page.getByRole('button', { name: `Mover ${question}` }) });
    await row.getByRole('button', { name: 'Borrar' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar' }).click();
    await expect.poll(questions).not.toContain(question);
  }
});

test('subir una foto a la biblioteca y borrarla', async () => {
  await openSection('Imágenes');
  // Una foto de muestra con bytes extra al final: es una imagen válida con otro hash.
  const sample = readFileSync(
    resolve(import.meta.dirname, '../../../apps/api/prisma/seed-media/gas-1.jpg'),
  );
  const buffer = Buffer.concat([sample, Buffer.from(`prueba-${Date.now()}`)]);
  const alt = `Foto de prueba ${Date.now()}`;

  await page
    .getByLabel('Elegir fotos')
    .setInputFiles({ name: 'prueba.jpg', mimeType: 'image/jpeg', buffer });
  await page.getByLabel('Texto alternativo de prueba.jpg').fill(alt);
  await page.getByRole('button', { name: 'Subir 1 foto' }).click();
  await expect(page.getByText('Subida', { exact: true })).toBeVisible({ timeout: 60_000 });

  const library = page.getByRole('list', { name: 'Biblioteca de imágenes' });
  await library.getByRole('button', { name: `Ver ${alt}` }).click();
  const dialog = page.getByRole('dialog', { name: 'Imagen' });
  await expect(dialog.getByText('No la usa ningún contenido.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Borrar' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Borrar' }).click();
  await expect(page.getByText('Imagen borrada')).toBeVisible();
  await expect(library.getByRole('button', { name: `Ver ${alt}` })).toHaveCount(0);
});

test('en el celular: barra inferior y sin scroll horizontal', async () => {
  await page.setViewportSize({ width: 412, height: 915 }); // Pixel 7
  try {
    const bar = page.getByRole('navigation', { name: 'Secciones' });
    for (const name of ['Inicio', 'Servicios', 'Trabajos', 'Imágenes']) {
      await bar.getByRole('link', { name }).click();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('navigation', { name: 'Menú principal' })).toBeHidden();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `scroll horizontal en ${name}`).toBeLessThanOrEqual(0);
    }

    await bar.getByRole('button', { name: 'Más' }).click();
    await page
      .getByRole('dialog', { name: 'Más secciones' })
      .getByRole('link', { name: 'Configuración' })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Configuración' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Más secciones' })).toBeHidden();
  } finally {
    await page.setViewportSize({ width: 1280, height: 720 });
  }
});
