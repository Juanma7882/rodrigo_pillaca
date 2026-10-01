import type { NestExpressApplication } from '@nestjs/platform-express';
import { adminServiceSchema, servicesResponseSchema } from '@tamila/shared';
import request from 'supertest';
import { z } from 'zod';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  adminToken,
  createTestApp,
  fakeMedia,
  resetContent,
  SERVICE_TEXTS,
  SETTINGS,
} from './utils';

describe('Admin · servicios (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  const ids: Record<string, string> = {};

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    token = await adminToken(app);
  });
  beforeEach(async () => {
    await resetContent(app);
    await prisma.siteSettings.create({ data: { id: 1, ...SETTINGS } });
    for (const [order, slug] of ['durlock', 'steelframe', 'pintura'].entries()) {
      const row = await prisma.service.create({
        data: { ...SERVICE_TEXTS, slug, name: slug, order: order + 1 },
      });
      ids[slug] = row.id;
    }
  });
  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const bearer = () => ({ Authorization: `Bearer ${token}` });
  const publicSlugs = async () =>
    servicesResponseSchema
      .parse((await http().get('/api/public/services').expect(200)).body)
      .map((s) => [s.number, s.slug]);

  it('sin token responde 401', async () => {
    await http().get('/api/admin/services').expect(401);
    await http().post('/api/admin/services').send({}).expect(401);
    await http().put('/api/admin/services/order').send({ ids: [] }).expect(401);
  });

  it('lista todos los servicios en orden, incluidos los no publicados', async () => {
    await prisma.service.update({ where: { id: ids.pintura }, data: { published: false } });
    const res = await http().get('/api/admin/services').set(bearer()).expect(200);
    const list = z.array(adminServiceSchema).parse(res.body);
    expect(list.map((s) => [s.slug, s.published])).toEqual([
      ['durlock', true],
      ['steelframe', true],
      ['pintura', false],
    ]);
  });

  it('crea un servicio no publicado al final del orden, invisible en el sitio', async () => {
    const res = await http()
      .post('/api/admin/services')
      .set(bearer())
      .send({ ...SERVICE_TEXTS, slug: 'instalacion-de-aire', name: 'Aire', published: false })
      .expect(201);
    const created = adminServiceSchema.parse(res.body);
    expect(created.order).toBe(4);
    expect(created.published).toBe(false);
    expect((await publicSlugs()).map(([, slug]) => slug)).not.toContain('instalacion-de-aire');
  });

  it('un slug repetido responde 409', async () => {
    const res = await http()
      .post('/api/admin/services')
      .set(bearer())
      .send({ ...SERVICE_TEXTS, slug: 'durlock', name: 'Otro' })
      .expect(409);
    expect(res.body.message).toContain('ya está en uso');
    await http()
      .patch(`/api/admin/services/${ids.pintura}`)
      .set(bearer())
      .send({ slug: 'durlock' })
      .expect(409);
  });

  it('la galería queda con las imágenes enviadas y en ese orden', async () => {
    const [a, b, c] = await Promise.all(['a', 'b', 'c'].map((n) => fakeMedia(app, n)));
    const res = await http()
      .patch(`/api/admin/services/${ids.durlock}`)
      .set(bearer())
      .send({ coverImageId: a!.id, imageIds: [c!.id, a!.id, b!.id] })
      .expect(200);
    const service = adminServiceSchema.parse(res.body);
    expect(service.coverImage?.id).toBe(a!.id);
    expect(service.images.map((i) => i.id)).toEqual([c!.id, a!.id, b!.id]);

    const again = await http()
      .patch(`/api/admin/services/${ids.durlock}`)
      .set(bearer())
      .send({ imageIds: [b!.id] })
      .expect(200);
    expect(again.body.images.map((i: { id: string }) => i.id)).toEqual([b!.id]);
  });

  it('una imagen inexistente en la galería responde 400 con su índice', async () => {
    const a = await fakeMedia(app, 'a');
    const res = await http()
      .patch(`/api/admin/services/${ids.durlock}`)
      .set(bearer())
      .send({ imageIds: [a.id, '00000000-0000-4000-8000-0000000000ff'] })
      .expect(400);
    expect(res.body.errors[0].field).toBe('imageIds.1');
  });

  it('el destacado tiene que ser un trabajo del mismo servicio', async () => {
    const own = await prisma.project.create({
      data: { title: 'Propio', description: '…', order: 1, serviceId: ids.durlock! },
    });
    const other = await prisma.project.create({
      data: { title: 'Ajeno', description: '…', order: 2, serviceId: ids.durlock! },
    });
    const res = await http()
      .patch(`/api/admin/services/${ids.pintura}`)
      .set(bearer())
      .send({ featuredProjectId: other.id })
      .expect(400);
    expect(res.body.errors[0].field).toBe('featuredProjectId');

    const ok = await http()
      .patch(`/api/admin/services/${ids.durlock}`)
      .set(bearer())
      .send({ featuredProjectId: own.id })
      .expect(200);
    expect(ok.body.featuredProjectId).toBe(own.id);
  });

  it('despublicar renumera los capítulos públicos sin huecos', async () => {
    await http()
      .patch(`/api/admin/services/${ids.steelframe}`)
      .set(bearer())
      .send({ published: false })
      .expect(200);
    expect(await publicSlugs()).toEqual([
      [1, 'durlock'],
      [2, 'pintura'],
    ]);
  });

  it('nombre vacío responde 400 y un id inexistente 404', async () => {
    const res = await http()
      .patch(`/api/admin/services/${ids.durlock}`)
      .set(bearer())
      .send({ name: '   ' })
      .expect(400);
    expect(res.body.errors[0].field).toBe('name');
    await http().get('/api/admin/services/no-existe').set(bearer()).expect(404);
    await http().patch('/api/admin/services/no-existe').set(bearer()).send({}).expect(404);
  });

  it('reordenar cambia el número de capítulo en el sitio', async () => {
    const res = await http()
      .put('/api/admin/services/order')
      .set(bearer())
      .send({ ids: [ids.pintura, ids.durlock, ids.steelframe] })
      .expect(200);
    expect(res.body.map((s: { slug: string }) => s.slug)).toEqual([
      'pintura',
      'durlock',
      'steelframe',
    ]);
    expect(await publicSlugs()).toEqual([
      [1, 'pintura'],
      [2, 'durlock'],
      [3, 'steelframe'],
    ]);
  });

  it('una lista incompleta responde 400 y no cambia el orden', async () => {
    await http()
      .put('/api/admin/services/order')
      .set(bearer())
      .send({ ids: [ids.pintura, ids.durlock] })
      .expect(400);
    expect((await publicSlugs()).map(([, slug]) => slug)).toEqual([
      'durlock',
      'steelframe',
      'pintura',
    ]);
  });

  it('no borra un servicio con trabajos', async () => {
    await prisma.project.createMany({
      data: [
        { title: 'Uno', description: '…', order: 1, serviceId: ids.durlock! },
        { title: 'Dos', description: '…', order: 2, serviceId: ids.durlock! },
      ],
    });
    const res = await http().delete(`/api/admin/services/${ids.durlock}`).set(bearer()).expect(409);
    expect(res.body.message).toContain('2 trabajos');
    expect(await prisma.service.count()).toBe(3);
    expect(await prisma.project.count()).toBe(2);
  });

  it('borra un servicio sin trabajos, conserva sus imágenes y compacta el orden', async () => {
    const media = await fakeMedia(app, 'portada');
    await prisma.service.update({ where: { id: ids.durlock }, data: { coverImageId: media.id } });
    await http().delete(`/api/admin/services/${ids.durlock}`).set(bearer()).expect(204);

    const rows = await prisma.service.findMany({ orderBy: { order: 'asc' } });
    expect(rows.map((s) => [s.order, s.slug])).toEqual([
      [1, 'steelframe'],
      [2, 'pintura'],
    ]);
    expect(await prisma.mediaAsset.count({ where: { id: media.id } })).toBe(1);
  });
});
