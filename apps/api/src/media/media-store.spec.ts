import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import type { MediaAsset } from '../generated/prisma/client';
import { removeImageFiles, storeImage, toMediaDto, type MediaDirs } from './media-store';

/** Tabla media_assets en memoria, con la parte de la API de Prisma que usa storeImage. */
function fakePrisma() {
  const rows = new Map<string, MediaAsset>();
  let seq = 0;
  const byHash = (hash: string) => [...rows.values()].find((r) => r.hash === hash) ?? null;
  const mediaAsset = {
    findUnique: async ({ where }: { where: { hash: string } }) => byHash(where.hash),
    update: async ({ where, data }: { where: { id: string }; data: Partial<MediaAsset> }) => {
      const row = { ...rows.get(where.id)!, ...data };
      rows.set(row.id, row);
      return row;
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where: { hash: string };
      create: Partial<MediaAsset>;
      update: Partial<MediaAsset>;
    }) => {
      const current = byHash(where.hash);
      const row = current
        ? { ...current, ...update }
        : ({ id: `m${++seq}`, encodingVersion: 1, createdAt: new Date(), ...create } as MediaAsset);
      rows.set(row.id, row);
      return row;
    },
  };
  return { prisma: { mediaAsset } as never, rows };
}

const photo = () =>
  sharp({ create: { width: 1200, height: 800, channels: 3, background: '#336699' } })
    .jpeg()
    .withExif({ IFD0: { Copyright: 'TAMILA' } })
    .toBuffer();

describe('storeImage', () => {
  let root: string;
  let dirs: MediaDirs;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'tamila-store-'));
    dirs = { mediaDir: join(root, 'media'), originalsDir: join(root, 'media-originals') };
  });
  afterEach(() => rm(root, { recursive: true, force: true }));

  it('guarda el original fuera de la carpeta pública y registra la versión', async () => {
    const { prisma } = fakePrisma();
    const input = await photo();
    const asset = await storeImage(prisma, dirs, input, { alt: 'Living' });

    expect(asset.originalPath).toMatch(/^[0-9a-f]{20}\.jpg$/);
    expect(asset.encodingVersion).toBe(2);
    expect(await readFile(join(dirs.originalsDir, asset.originalPath!))).toEqual(input);
    expect(await readdir(dirs.mediaDir)).not.toContain(asset.originalPath);
  });

  it('la misma imagen no se vuelve a procesar y completa el original si faltaba', async () => {
    const { prisma, rows } = fakePrisma();
    const input = await photo();
    const first = await storeImage(prisma, dirs, input, { alt: 'Living' });
    rows.set(first.id, { ...first, originalPath: null });
    await rm(dirs.originalsDir, { recursive: true });

    const again = await storeImage(prisma, dirs, input, { alt: 'Living renovado' });
    expect(again.id).toBe(first.id);
    expect(rows.size).toBe(1);
    expect(again.alt).toBe('Living renovado');
    expect(again.originalPath).toBe(first.originalPath);
    expect(await readdir(dirs.originalsDir)).toEqual([first.originalPath]);
  });

  it('removeImageFiles borra variantes y original', async () => {
    const { prisma } = fakePrisma();
    const asset = await storeImage(prisma, dirs, await photo(), { alt: 'Living' });
    await removeImageFiles(dirs, asset);
    expect(await readdir(dirs.mediaDir)).toEqual([]);
    expect(await readdir(dirs.originalsDir)).toEqual([]);
  });
});

describe('toMediaDto', () => {
  it('no expone los pesos ni el original en el formato público', () => {
    const dto = toMediaDto({
      id: 'm1',
      hash: 'h',
      path: '/media/h-v2-480.webp',
      alt: 'Foto',
      width: 480,
      height: 320,
      variants: [
        {
          width: 480,
          avif: '/media/h-v2-480.avif',
          webp: '/media/h-v2-480.webp',
          avifBytes: 1,
          webpBytes: 2,
        },
      ],
      credit: null,
      originalPath: 'h.jpg',
      encodingVersion: 2,
      createdAt: new Date(),
    });
    expect(dto.variants).toEqual([
      { width: 480, avif: '/media/h-v2-480.avif', webp: '/media/h-v2-480.webp' },
    ]);
    expect(dto).not.toHaveProperty('originalPath');
  });
});
