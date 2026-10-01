import type { NestExpressApplication } from '@nestjs/platform-express';
import { adminProjectSchema, projectsResponseSchema } from '@tamila/shared';
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

describe('Admin · trabajos (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let token: string;
  let durlock: string;
  let steelframe: string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    token = await adminToken(app);
  });
  beforeEach(async () => {
    await resetContent(app);
    await prisma.siteSettings.create({ data: { id: 1, ...SETTINGS } });
    durlock = (
      await prisma.service.create({
        data: { ...SERVICE_TEXTS, slug: 'durlock', name: 'Durlock', order: 1 },
      })
    ).id;
    steelframe = (
      await prisma.service.create({
        data: { ...SERVICE_TEXTS, slug: 'steelframe', name: 'Steelframe', order: 2 },
      })
    ).id;
  });
  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const bearer = () => ({ Authorization: `Bearer ${token}` });
  const create = (body: object) =>
    http()
      .post('/api/admin/projects')
      .set(bearer())
      .send({ title: 'Casa', description: 'Texto', serviceId: durlock, ...body });
  const publicTitles = async () =>
    projectsResponseSchema
      .parse((await http().get('/api/public/projects').expect(200)).body)
      .map((p) => p.title);

  it('sin token responde 401', async () => {
    await http().get('/api/admin/projects').expect(401);
    await http().delete('/api/admin/projects/x').expect(401);
  });

  it('crea un trabajo publicado con antes/después y aparece en el sitio', async () => {
    const [before, after] = await Promise.all([fakeMedia(app, 'antes'), fakeMedia(app, 'despues')]);
    const res = await create({
      title: 'Oficina en Palermo',
      year: 2025,
      location: 'Palermo, CABA',
      published: true,
      beforeImageId: before.id,
      afterImageId: after.id,
    }).expect(201);
    const project = adminProjectSchema.parse(res.body);
    expect(project.order).toBe(1);
    expect(project.service).toEqual({ slug: 'durlock', name: 'Durlock' });

    const pub = projectsResponseSchema.parse((await http().get('/api/public/projects')).body);
    expect(pub[0]?.beforeImage?.id).toBe(before.id);
    expect(pub[0]?.afterImage?.id).toBe(after.id);
  });

  it('por defecto queda sin publicar', async () => {
    const res = await create({}).expect(201);
    expect(res.body.published).toBe(false);
    expect(await publicTitles()).toEqual([]);
  });

  it('un servicio inexistente responde 400 en serviceId', async () => {
    const res = await create({ serviceId: '00000000-0000-4000-8000-0000000000ff' }).expect(400);
    expect(res.body.errors[0].field).toBe('serviceId');
  });

  it('un año fuera de rango responde 400 en year', async () => {
    const res = await create({ year: 1950 }).expect(400);
    expect(res.body.errors[0].field).toBe('year');
  });

  it('filtra por servicio', async () => {
    await create({ title: 'A' }).expect(201);
    await create({ title: 'B', serviceId: steelframe }).expect(201);
    const res = await http()
      .get(`/api/admin/projects?serviceId=${steelframe}`)
      .set(bearer())
      .expect(200);
    expect(
      z
        .array(adminProjectSchema)
        .parse(res.body)
        .map((p) => p.title),
    ).toEqual(['B']);
  });

  it('al moverlo de servicio deja de ser el destacado del anterior', async () => {
    const { body } = await create({ published: true }).expect(201);
    await prisma.service.update({ where: { id: durlock }, data: { featuredProjectId: body.id } });
    expect((await http().get(`/api/admin/projects/${body.id}`).set(bearer())).body.featured).toBe(
      true,
    );

    const res = await http()
      .patch(`/api/admin/projects/${body.id}`)
      .set(bearer())
      .send({ serviceId: steelframe })
      .expect(200);
    expect(res.body.featured).toBe(false);
    const service = await prisma.service.findUniqueOrThrow({ where: { id: durlock } });
    expect(service.featuredProjectId).toBeNull();
  });

  it('la galería queda en el orden enviado', async () => {
    const [a, b] = await Promise.all([fakeMedia(app, 'a'), fakeMedia(app, 'b')]);
    const { body } = await create({ imageIds: [b.id, a.id] }).expect(201);
    expect(body.images.map((i: { id: string }) => i.id)).toEqual([b.id, a.id]);
  });

  it('reordena y el sitio respeta el nuevo orden', async () => {
    const first = (await create({ title: 'Primero', published: true })).body;
    const second = (await create({ title: 'Segundo', published: true })).body;
    await http()
      .put('/api/admin/projects/order')
      .set(bearer())
      .send({ ids: [second.id, first.id] })
      .expect(200);
    expect(await publicTitles()).toEqual(['Segundo', 'Primero']);
  });

  it('borra, compacta el orden y quita el destacado', async () => {
    const first = (await create({ title: 'Primero' })).body;
    const second = (await create({ title: 'Segundo' })).body;
    await prisma.service.update({ where: { id: durlock }, data: { featuredProjectId: first.id } });

    await http().delete(`/api/admin/projects/${first.id}`).set(bearer()).expect(204);
    const rest = await prisma.project.findMany();
    expect(rest.map((p) => [p.id, p.order])).toEqual([[second.id, 1]]);
    const service = await prisma.service.findUniqueOrThrow({ where: { id: durlock } });
    expect(service.featuredProjectId).toBeNull();
  });

  it('un id inexistente responde 404', async () => {
    await http().get('/api/admin/projects/no-existe').set(bearer()).expect(404);
    await http().patch('/api/admin/projects/no-existe').set(bearer()).send({}).expect(404);
    await http().delete('/api/admin/projects/no-existe').set(bearer()).expect(404);
  });
});
