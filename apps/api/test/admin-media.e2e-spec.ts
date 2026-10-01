import type { NestExpressApplication } from '@nestjs/platform-express';
import { adminMediaPageSchema, adminMediaSchema, servicesResponseSchema } from '@tamila/shared';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { adminToken, createTestApp, resetContent, SERVICE_TEXTS, SETTINGS } from './utils';

const MEDIA_DIR = () => process.env.MEDIA_DIR!;
const ORIGINALS_DIR = () => process.env.MEDIA_ORIGINALS_DIR!;
const files = async (dir: string) => (existsSync(dir) ? readdir(dir) : []);

/** Foto de prueba: cada color genera un archivo distinto (hash distinto). */
const jpeg = (background: string, width = 1200, height = 800) =>
  sharp({ create: { width, height, channels: 3, background } })
    .jpeg()
    .toBuffer();

describe('Admin · imágenes (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    token = await adminToken(app);
  });
  beforeEach(async () => {
    await resetContent(app);
    await prisma.siteSettings.create({ data: { id: 1, ...SETTINGS } });
  });
  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const bearer = () => ({ Authorization: `Bearer ${token}` });
  const upload = (
    buffer: Buffer,
    fields: Record<string, string> = { alt: 'Foto' },
    name = 'foto.jpg',
  ) => {
    let req = http().post('/api/admin/media').set(bearer());
    for (const [key, value] of Object.entries(fields)) req = req.field(key, value);
    return req.attach('file', buffer, name);
  };

  it('sin token responde 401 y no guarda nada', async () => {
    const before = (await files(MEDIA_DIR())).length;
    await http()
      .post('/api/admin/media')
      .attach('file', await jpeg('#111111'), 'x.jpg')
      .expect(401);
    await http().get('/api/admin/media').expect(401);
    expect((await files(MEDIA_DIR())).length).toBe(before);
  });

  describe('subida', () => {
    it('un JPEG de 4000×3000 se guarda en 1600 px con pesos y variantes servidas en /media', async () => {
      const res = await upload(await jpeg('#c0ffee', 4000, 3000), {
        alt: 'Tabique terminado',
        credit: 'Foto: TAMILA',
      }).expect(201);
      const media = adminMediaSchema.parse(res.body);
      expect([media.width, media.height]).toEqual([1600, 1200]);
      expect(media.sizes.map((s) => s.width)).toEqual([480, 960, 1600]);
      expect(media.sizes.every((s) => s.avifBytes > 0 && s.webpBytes > 0)).toBe(true);
      expect(media.totalBytes).toBe(
        media.sizes.reduce((sum, s) => sum + s.avifBytes + s.webpBytes, 0),
      );
      expect(media.credit).toBe('Foto: TAMILA');
      expect(media.usages).toEqual([]);

      for (const variant of media.variants) {
        const avif = await http().get(variant.avif).expect(200);
        expect(avif.headers['content-type']).toBe('image/avif');
        await http().get(variant.webp).expect(200);
      }
      const asset = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: media.id } });
      expect(await files(ORIGINALS_DIR())).toContain(asset.originalPath);
    });

    it('un PDF renombrado como .jpg responde 400 y no guarda nada', async () => {
      const before = (await files(MEDIA_DIR())).length;
      const res = await upload(Buffer.from('%PDF-1.4\n%falso\n'), { alt: 'x' }, 'foto.jpg').expect(
        400,
      );
      expect(res.body.errors[0].field).toBe('file');
      expect(res.body.errors[0].message).toContain('JPEG, PNG, WebP o AVIF');
      expect((await files(MEDIA_DIR())).length).toBe(before);
      expect(await prisma.mediaAsset.count()).toBe(0);
    });

    it('una imagen de más de 10 MB responde 413', async () => {
      const res = await upload(Buffer.alloc(15 * 1024 * 1024, 1)).expect(413);
      expect(res.body.message).toBe('La imagen supera el máximo de 10 MB');
      expect(await prisma.mediaAsset.count()).toBe(0);
    });

    it('sin texto alternativo responde 400 en alt', async () => {
      const res = await upload(await jpeg('#222222'), {}).expect(400);
      expect(res.body.errors[0].field).toBe('alt');
    });

    it('sin archivo responde 400 en file', async () => {
      const res = await http()
        .post('/api/admin/media')
        .set(bearer())
        .field('alt', 'Foto')
        .expect(400);
      expect(res.body.errors[0].field).toBe('file');
    });

    it('el mismo archivo dos veces devuelve la misma imagen', async () => {
      const buffer = await jpeg('#abcdef');
      const first = await upload(buffer, { alt: 'Primera' }).expect(201);
      const second = await upload(buffer, { alt: 'Segunda' }).expect(201);
      expect(second.body.id).toBe(first.body.id);
      expect(second.body.alt).toBe('Segunda');
      expect(await prisma.mediaAsset.count()).toBe(1);
    });
  });

  describe('biblioteca', () => {
    it('indica dónde se usa cada imagen y filtra las que no tienen uso', async () => {
      const cover = (await upload(await jpeg('#010101'), { alt: 'Portada' })).body;
      const loose = (await upload(await jpeg('#020202'), { alt: 'Suelta' })).body;
      await prisma.service.create({
        data: {
          ...SERVICE_TEXTS,
          slug: 'durlock',
          name: 'Durlock',
          order: 1,
          coverImageId: cover.id,
        },
      });

      const all = adminMediaPageSchema.parse(
        (await http().get('/api/admin/media').set(bearer()).expect(200)).body,
      );
      expect(all.total).toBe(2);
      expect(all.items.find((m) => m.id === cover.id)?.usages).toEqual([
        { kind: 'serviceCover', id: expect.any(String), label: 'Portada de Durlock' },
      ]);

      const unused = adminMediaPageSchema.parse(
        (await http().get('/api/admin/media?unused=true').set(bearer()).expect(200)).body,
      );
      expect(unused.items.map((m) => m.id)).toEqual([loose.id]);
    });

    it('pagina de la más nueva a la más vieja', async () => {
      const ids = [];
      for (const color of ['#030303', '#040404', '#050505']) {
        ids.push((await upload(await jpeg(color))).body.id);
      }
      const page = adminMediaPageSchema.parse(
        (await http().get('/api/admin/media?page=2&pageSize=2').set(bearer()).expect(200)).body,
      );
      expect(page.total).toBe(3);
      expect(page.items.map((m) => m.id)).toEqual([ids[0]]);
    });

    it('el sitio público no expone los pesos', async () => {
      const cover = (await upload(await jpeg('#060606'))).body;
      await prisma.service.create({
        data: {
          ...SERVICE_TEXTS,
          slug: 'durlock',
          name: 'Durlock',
          order: 1,
          coverImageId: cover.id,
        },
      });
      const res = await http().get('/api/public/services').expect(200);
      expect(Object.keys(res.body[0].coverImage.variants[0]).sort()).toEqual([
        'avif',
        'webp',
        'width',
      ]);
    });

    it('el nuevo alt aparece en el sitio público', async () => {
      const cover = (await upload(await jpeg('#070707'), { alt: 'Viejo' })).body;
      await prisma.service.create({
        data: {
          ...SERVICE_TEXTS,
          slug: 'durlock',
          name: 'Durlock',
          order: 1,
          coverImageId: cover.id,
        },
      });
      const res = await http()
        .patch(`/api/admin/media/${cover.id}`)
        .set(bearer())
        .send({ alt: 'Cielorraso de durlock terminado' })
        .expect(200);
      expect(res.body.alt).toBe('Cielorraso de durlock terminado');
      const pub = servicesResponseSchema.parse((await http().get('/api/public/services')).body);
      expect(pub[0]?.coverImage?.alt).toBe('Cielorraso de durlock terminado');
      await http().patch('/api/admin/media/no-existe').set(bearer()).send({ alt: 'x' }).expect(404);
    });
  });

  describe('borrado', () => {
    it('no borra la imagen del hero', async () => {
      const hero = (await upload(await jpeg('#080808'))).body;
      await prisma.siteSettings.update({ where: { id: 1 }, data: { heroImageId: hero.id } });
      const res = await http().delete(`/api/admin/media/${hero.id}`).set(bearer()).expect(409);
      expect(res.body.message).toContain('Foto del hero');
      const settings = await prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } });
      expect(settings.heroImageId).toBe(hero.id);
    });

    it('borra una imagen sin uso con sus variantes y su original', async () => {
      const media = adminMediaSchema.parse((await upload(await jpeg('#090909'))).body);
      const { originalPath } = await prisma.mediaAsset.findUniqueOrThrow({
        where: { id: media.id },
      });

      await http().delete(`/api/admin/media/${media.id}`).set(bearer()).expect(204);
      await http().get(media.variants[0]!.webp).expect(404);
      expect(existsSync(join(ORIGINALS_DIR(), originalPath!))).toBe(false);
      await http().delete(`/api/admin/media/${media.id}`).set(bearer()).expect(404);
    });
  });
});
