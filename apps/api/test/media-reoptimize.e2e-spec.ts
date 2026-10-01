import type { NestExpressApplication } from '@nestjs/platform-express';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import { hashImage } from '../src/media/media-processor';
import { reoptimizeMedia } from '../src/media/reoptimize';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, resetContent, SERVICE_TEXTS } from './utils';

const dirs = () => ({
  mediaDir: process.env.MEDIA_DIR!,
  originalsDir: process.env.MEDIA_ORIGINALS_DIR!,
});

/** Imagen "v1": variantes con los nombres viejos (sin versión) y, si se indica, su original. */
async function legacyAsset(prisma: PrismaService, color: string, withOriginal: boolean) {
  const original = await sharp({
    create: { width: 1000, height: 700, channels: 3, background: color },
  })
    .jpeg()
    .toBuffer();
  const hash = hashImage(original);
  const { mediaDir, originalsDir } = dirs();
  await mkdir(mediaDir, { recursive: true });
  await mkdir(originalsDir, { recursive: true });
  const variants = [480, 960].map((width) => ({
    width,
    avif: `/media/${hash}-${width}.avif`,
    webp: `/media/${hash}-${width}.webp`,
  }));
  for (const v of variants) {
    await writeFile(join(mediaDir, v.avif.replace('/media/', '')), 'viejo');
    await writeFile(join(mediaDir, v.webp.replace('/media/', '')), 'viejo');
  }
  if (withOriginal) await writeFile(join(originalsDir, `${hash}.jpg`), original);
  return prisma.mediaAsset.create({
    data: {
      hash,
      path: variants.at(-1)!.webp,
      alt: `Foto ${color}`,
      width: 960,
      height: 672,
      variants,
      originalPath: withOriginal ? `${hash}.jpg` : null,
      encodingVersion: 1,
    },
  });
}

describe('Re-optimización de imágenes (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(() => resetContent(app));
  afterAll(() => app.close());

  it('regenera con URLs nuevas, conserva id y usos, y omite las que no tienen original', async () => {
    const cover = await legacyAsset(prisma, '#aa0000', true);
    const orphan = await legacyAsset(prisma, '#00aa00', false);
    await prisma.service.create({
      data: {
        ...SERVICE_TEXTS,
        slug: 'durlock',
        name: 'Durlock',
        order: 1,
        coverImageId: cover.id,
      },
    });

    const summary = await reoptimizeMedia(prisma, dirs());
    expect(summary.processed.map((p) => p.id)).toEqual([cover.id]);
    expect(summary.skipped).toEqual([{ id: orphan.id, hash: orphan.hash, alt: orphan.alt }]);

    const http = () => request(app.getHttpServer());
    const [service] = (await http().get('/api/public/services').expect(200)).body;
    expect(service.coverImage.id).toBe(cover.id);
    for (const variant of service.coverImage.variants) {
      expect(variant.webp).toContain(`${cover.hash}-v2-`);
      await http().get(variant.webp).expect(200);
      await http().get(variant.avif).expect(200);
    }
    for (const old of cover.variants as { webp: string; avif: string }[]) {
      await http().get(old.webp).expect(404);
      await http().get(old.avif).expect(404);
    }
    const updated = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: cover.id } });
    expect(updated.encodingVersion).toBe(2);
    expect(updated.alt).toBe(cover.alt);

    const again = await reoptimizeMedia(prisma, dirs());
    expect(again.processed).toEqual([]);
  });

  it('con force regenera aunque ya esté en la versión vigente, sin borrar los archivos nuevos', async () => {
    const asset = await legacyAsset(prisma, '#0000aa', true);
    await reoptimizeMedia(prisma, dirs());
    const forced = await reoptimizeMedia(prisma, dirs(), { force: true });
    expect(forced.processed.map((p) => p.id)).toContain(asset.id);

    const row = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: asset.id } });
    for (const v of row.variants as { webp: string }[]) {
      await request(app.getHttpServer()).get(v.webp).expect(200);
    }
  });
});
