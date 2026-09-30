import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  projectsResponseSchema,
  serviceDetailSchema,
  servicesResponseSchema,
  siteContentSchema,
} from '@tamila/shared';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './utils';

const variants = [{ width: 480, avif: '/media/x-480.avif', webp: '/media/x-480.webp' }];

describe('Contenido público (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await prisma.$transaction([
      prisma.service.updateMany({ data: { featuredProjectId: null } }),
      prisma.project.deleteMany(),
      prisma.service.deleteMany(),
      prisma.siteSettings.deleteMany(),
      prisma.mediaAsset.deleteMany(),
      prisma.processStep.deleteMany(),
      prisma.faq.deleteMany(),
    ]);

    const media = await prisma.mediaAsset.create({
      data: {
        hash: 'h1',
        path: '/media/x-480.webp',
        alt: 'Foto',
        width: 480,
        height: 320,
        variants,
      },
    });
    await prisma.siteSettings.create({
      data: {
        heroTitle: 'Construimos, renovamos, terminamos.',
        heroSubtitle: 'Subtítulo',
        whatsappNumber: '5491100000000',
        whatsappDefaultMessage: 'Hola',
        seoTitle: 'TAMILA',
        seoDescription: 'Descripción',
      },
    });
    await prisma.processStep.createMany({
      data: [
        { order: 2, title: 'Visita', description: '…' },
        { order: 1, title: 'Contacto', description: '…' },
      ],
    });
    await prisma.faq.createMany({
      data: [
        { order: 1, question: '¿Publicada?', answer: 'Sí' },
        { order: 2, question: '¿Oculta?', answer: 'No', published: false },
      ],
    });

    const base = {
      tagline: 'Bajada',
      summary: 'Resumen',
      description: 'Texto',
      includes: ['Algo'],
    };
    const durlock = await prisma.service.create({
      data: { ...base, slug: 'durlock', name: 'Durlock', order: 1, coverImageId: media.id },
    });
    await prisma.service.create({
      data: { ...base, slug: 'oculto', name: 'Oculto', order: 2, published: false },
    });
    await prisma.service.create({ data: { ...base, slug: 'pintura', name: 'Pintura', order: 3 } });
    await prisma.serviceImage.create({
      data: { serviceId: durlock.id, mediaId: media.id, order: 0 },
    });

    const project = await prisma.project.create({
      data: {
        title: 'Oficina',
        description: 'Tabiques',
        order: 1,
        serviceId: durlock.id,
        afterImageId: media.id,
      },
    });
    await prisma.project.create({
      data: {
        title: 'Borrador',
        description: '…',
        order: 2,
        serviceId: durlock.id,
        published: false,
      },
    });
    await prisma.service.update({
      where: { id: durlock.id },
      data: { featuredProjectId: project.id },
    });
  });

  afterAll(() => app.close());

  const get = (path: string) => request(app.getHttpServer()).get(`/api/public${path}`);

  it('GET /site devuelve la configuración, los pasos ordenados y solo las preguntas publicadas', async () => {
    const res = await get('/site').expect(200);
    const body = siteContentSchema.parse(res.body);
    expect(body.processSteps.map((s) => s.title)).toEqual(['Contacto', 'Visita']);
    expect(body.faqs.map((f) => f.question)).toEqual(['¿Publicada?']);
    expect(body.services).toEqual([
      { slug: 'durlock', name: 'Durlock' },
      { slug: 'pintura', name: 'Pintura' },
    ]);
    expect(res.headers['cache-control']).toBe('public, max-age=60, stale-while-revalidate=300');
  });

  it('GET /services devuelve solo los publicados, numerados sin huecos', async () => {
    const res = await get('/services').expect(200);
    const body = servicesResponseSchema.parse(res.body);
    expect(body.map((s) => [s.number, s.slug])).toEqual([
      [1, 'durlock'],
      [2, 'pintura'],
    ]);
    expect(body[0]?.featuredProject?.title).toBe('Oficina');
  });

  it('GET /services/:slug devuelve el detalle con vecinos y trabajos publicados', async () => {
    const res = await get('/services/durlock').expect(200);
    const body = serviceDetailSchema.parse(res.body);
    expect(body.previous).toBeNull();
    expect(body.next).toEqual({ slug: 'pintura', name: 'Pintura' });
    expect(body.projects.map((p) => p.title)).toEqual(['Oficina']);
    expect(body.seoTitle).toBe('Durlock · TAMILA');
  });

  it('un servicio no publicado o inexistente responde 404', async () => {
    await get('/services/oculto').expect(404);
    const res = await get('/services/no-existe').expect(404);
    expect(res.body.message).toBe('Servicio no encontrado');
  });

  it('GET /projects devuelve solo los trabajos publicados', async () => {
    const res = await get('/projects').expect(200);
    expect(projectsResponseSchema.parse(res.body).map((p) => p.title)).toEqual(['Oficina']);
  });

  it('los endpoints son de solo lectura', async () => {
    for (const path of ['/site', '/services', '/services/durlock', '/projects']) {
      await request(app.getHttpServer()).post(`/api/public${path}`).expect(404);
      await request(app.getHttpServer()).delete(`/api/public${path}`).expect(404);
    }
    expect(await prisma.service.count()).toBe(3);
  });
});
