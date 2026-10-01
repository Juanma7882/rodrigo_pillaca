import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import {
  budgetFor,
  MEDIA_BUDGET,
  MEDIA_ENCODING_VERSION,
  processImage,
  WEBP_QUALITIES,
} from './media-processor';

const image = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#f5c518' } })
    .jpeg()
    .toBuffer();

/** Ruido aleatorio: no se puede comprimir, así que ninguna calidad entra en el presupuesto. */
const noise = (width: number, height: number) => {
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.floor(Math.random() * 256);
  return sharp(raw, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
};

/** La foto más pesada del seed: su WebP de 1600 px pesa ~576 KB a calidad 78. */
const HEAVY_PHOTO = resolve(__dirname, '../../prisma/seed-media/pisos-flotantes-y-madera-3.jpg');

describe('processImage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tamila-media-'));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('genera AVIF y WebP en 480, 960 y 1600 px con nombres por hash y versión', async () => {
    const result = await processImage(await image(2400, 1600), dir);

    const files = await readdir(dir);
    expect(files).toHaveLength(6);
    expect(result.variants.map((v) => v.width)).toEqual([480, 960, 1600]);
    expect(result.width).toBe(1600);
    expect(result.height).toBe(1067);
    expect(result.encodingVersion).toBe(MEDIA_ENCODING_VERSION);
    expect(result.path).toBe(`/media/${result.hash}-v${MEDIA_ENCODING_VERSION}-1600.webp`);
    for (const variant of result.variants) {
      expect(files).toContain(variant.avif.replace('/media/', ''));
      expect(files).toContain(variant.webp.replace('/media/', ''));
    }
    const meta = await sharp(join(dir, `${result.hash}-v2-960.webp`)).metadata();
    expect([meta.width, meta.height]).toEqual([960, 640]);
  });

  it('informa el peso real de cada variante', async () => {
    const result = await processImage(await image(1000, 700), dir);
    for (const variant of result.variants) {
      const webp = await readFile(join(dir, variant.webp.replace('/media/', '')));
      const avif = await readFile(join(dir, variant.avif.replace('/media/', '')));
      expect(variant.webpBytes).toBe(webp.length);
      expect(variant.avifBytes).toBe(avif.length);
    }
  });

  it('no agranda imágenes chicas', async () => {
    const result = await processImage(await image(800, 600), dir);
    expect(result.variants.map((v) => v.width)).toEqual([480, 800]);
    expect(result.width).toBe(800);
    expect(await readdir(dir)).toHaveLength(4);
  });

  it('la misma imagen produce el mismo hash', async () => {
    const buffer = await image(1000, 1000);
    const [a, b] = await Promise.all([processImage(buffer, dir), processImage(buffer, dir)]);
    expect(a.hash).toBe(b.hash);
  });

  it('las variantes no conservan EXIF (ni la ubicación GPS) del original', async () => {
    const input = await sharp({
      create: { width: 900, height: 600, channels: 3, background: '#808080' },
    })
      .jpeg()
      .withExif({
        IFD0: { Make: 'Telefono', Copyright: 'Cliente' },
        IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '34/1 36/1 0/1' },
      })
      .toBuffer();
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const result = await processImage(input, dir);
    for (const variant of result.variants) {
      for (const file of [variant.avif, variant.webp]) {
        const meta = await sharp(join(dir, file.replace('/media/', ''))).metadata();
        expect(meta.exif).toBeUndefined();
      }
    }
  });

  it('una imagen liviana conserva la calidad inicial', async () => {
    const input = await image(2000, 1300);
    const result = await processImage(input, dir);
    const initial = await sharp(input)
      .resize({ width: 1600 })
      .webp({ quality: WEBP_QUALITIES[0], effort: 5, smartSubsample: true })
      .toBuffer();
    expect(result.variants.at(-1)?.webpBytes).toBe(initial.length);
    expect(result.overBudget).toEqual([]);
  });

  it('una foto pesada baja de calidad: la AVIF entra en el presupuesto y pesa menos que la WebP', async () => {
    const input = await readFile(HEAVY_PHOTO);
    const result = await processImage(input, dir);
    const initial = await sharp(input)
      .rotate()
      .resize({ width: 1600 })
      .webp({ quality: WEBP_QUALITIES[0], effort: 5, smartSubsample: true })
      .toBuffer();
    expect(initial.length).toBeGreaterThan(500 * 1024);

    const largest = result.variants.at(-1)!;
    expect(largest.avifBytes).toBeLessThanOrEqual(MEDIA_BUDGET[1600]);
    expect(largest.webpBytes).toBeLessThan(initial.length);
    for (const variant of result.variants) {
      expect(variant.avifBytes).toBeLessThanOrEqual(budgetFor(variant.width));
      expect(variant.avifBytes).toBeLessThanOrEqual(variant.webpBytes);
    }
    expect(result.overBudget.every((o) => o.format === 'webp')).toBe(true);
  }, 60_000);

  it('si ni en el piso de calidad entra, guarda igual e informa la variante', async () => {
    const result = await processImage(await noise(480, 320), dir);
    expect(result.variants).toHaveLength(1);
    expect(result.overBudget).toContainEqual(
      expect.objectContaining({ width: 480, format: 'webp', budget: MEDIA_BUDGET[480] }),
    );
    expect(await readdir(dir)).toHaveLength(2);
  }, 30_000);
});

describe('budgetFor', () => {
  it('usa el presupuesto del ancho nominal', () => {
    expect(budgetFor(1600)).toBe(MEDIA_BUDGET[1600]);
    expect(budgetFor(480)).toBe(MEDIA_BUDGET[480]);
  });

  it('escala por superficie las imágenes más chicas que el ancho nominal', () => {
    expect(budgetFor(800)).toBe(Math.round(MEDIA_BUDGET[960] * (800 / 960) ** 2));
  });
});
