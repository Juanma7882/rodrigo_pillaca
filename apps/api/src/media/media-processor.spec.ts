import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { processImage } from './media-processor';

const image = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#f5c518' } })
    .jpeg()
    .toBuffer();

describe('processImage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tamila-media-'));
  });
  afterEach(() => rm(dir, { recursive: true, force: true }));

  it('genera AVIF y WebP en 480, 960 y 1600 px con nombres por hash', async () => {
    const result = await processImage(await image(2400, 1600), dir);

    const files = await readdir(dir);
    expect(files).toHaveLength(6);
    expect(result.variants.map((v) => v.width)).toEqual([480, 960, 1600]);
    expect(result.width).toBe(1600);
    expect(result.height).toBe(1067);
    expect(result.path).toBe(`/media/${result.hash}-1600.webp`);
    for (const variant of result.variants) {
      expect(files).toContain(variant.avif.replace('/media/', ''));
      expect(files).toContain(variant.webp.replace('/media/', ''));
    }
    const meta = await sharp(join(dir, `${result.hash}-960.webp`)).metadata();
    expect([meta.width, meta.height]).toEqual([960, 640]);
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
});
