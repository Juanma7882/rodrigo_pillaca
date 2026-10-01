import type { NestExpressApplication } from '@nestjs/platform-express';
import { adminFaqSchema, adminProcessStepSchema, siteContentSchema } from '@tamila/shared';
import request from 'supertest';
import { z } from 'zod';
import { PrismaService } from '../src/prisma/prisma.service';
import { adminToken, createTestApp, resetContent, SETTINGS } from './utils';

describe('Admin · pasos y preguntas frecuentes (e2e)', () => {
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
  const site = async () =>
    siteContentSchema.parse((await http().get('/api/public/site').expect(200)).body);

  it('sin token responde 401', async () => {
    await http().get('/api/admin/process-steps').expect(401);
    await http().post('/api/admin/faqs').send({}).expect(401);
  });

  describe('pasos', () => {
    const createSteps = async (n: number) => {
      const ids: string[] = [];
      for (let i = 1; i <= n; i++) {
        const res = await http()
          .post('/api/admin/process-steps')
          .set(bearer())
          .send({ title: `Paso ${i}`, description: '…' })
          .expect(201);
        ids.push(adminProcessStepSchema.parse(res.body).id);
      }
      return ids;
    };

    it('los nuevos quedan al final', async () => {
      await createSteps(3);
      const res = await http().get('/api/admin/process-steps').set(bearer()).expect(200);
      expect(
        z
          .array(adminProcessStepSchema)
          .parse(res.body)
          .map((s) => [s.order, s.title]),
      ).toEqual([
        [1, 'Paso 1'],
        [2, 'Paso 2'],
        [3, 'Paso 3'],
      ]);
    });

    it('borrar el tercero de 5 deja el orden 1..4 consecutivo', async () => {
      const ids = await createSteps(5);
      await http().delete(`/api/admin/process-steps/${ids[2]}`).set(bearer()).expect(204);
      const rows = await prisma.processStep.findMany({ orderBy: { order: 'asc' } });
      expect(rows.map((s) => [s.order, s.title])).toEqual([
        [1, 'Paso 1'],
        [2, 'Paso 2'],
        [3, 'Paso 4'],
        [4, 'Paso 5'],
      ]);
    });

    it('reordenar intercambia posiciones a pesar del índice único', async () => {
      const [a, b, c] = await createSteps(3);
      await http()
        .put('/api/admin/process-steps/order')
        .set(bearer())
        .send({ ids: [c, a, b] })
        .expect(200);
      expect((await site()).processSteps.map((s) => s.title)).toEqual([
        'Paso 3',
        'Paso 1',
        'Paso 2',
      ]);
    });

    it('editar un paso y 404 si no existe', async () => {
      const [a] = await createSteps(1);
      const res = await http()
        .patch(`/api/admin/process-steps/${a}`)
        .set(bearer())
        .send({ title: '  Visita  ' })
        .expect(200);
      expect(res.body.title).toBe('Visita');
      await http().patch('/api/admin/process-steps/x').set(bearer()).send({}).expect(404);
      await http().delete('/api/admin/process-steps/x').set(bearer()).expect(404);
    });
  });

  describe('preguntas frecuentes', () => {
    it('una pregunta no publicada aparece en el admin y no en el sitio', async () => {
      await http()
        .post('/api/admin/faqs')
        .set(bearer())
        .send({ question: '¿Visible?', answer: 'Sí' })
        .expect(201);
      await http()
        .post('/api/admin/faqs')
        .set(bearer())
        .send({ question: '¿Oculta?', answer: 'No', published: false })
        .expect(201);

      const admin = z
        .array(adminFaqSchema)
        .parse((await http().get('/api/admin/faqs').set(bearer()).expect(200)).body);
      expect(admin.map((f) => f.question)).toEqual(['¿Visible?', '¿Oculta?']);
      expect((await site()).faqs.map((f) => f.question)).toEqual(['¿Visible?']);
    });

    it('una pregunta vacía responde 400', async () => {
      const res = await http()
        .post('/api/admin/faqs')
        .set(bearer())
        .send({ question: '  ', answer: 'Sí' })
        .expect(400);
      expect(res.body.errors[0].field).toBe('question');
    });

    it('reordenar, editar y borrar', async () => {
      const a = (
        await http().post('/api/admin/faqs').set(bearer()).send({ question: 'A', answer: '1' })
      ).body;
      const b = (
        await http().post('/api/admin/faqs').set(bearer()).send({ question: 'B', answer: '2' })
      ).body;
      await http()
        .put('/api/admin/faqs/order')
        .set(bearer())
        .send({ ids: [a.id] })
        .expect(400);
      await http()
        .put('/api/admin/faqs/order')
        .set(bearer())
        .send({ ids: [b.id, a.id] })
        .expect(200);
      await http()
        .patch(`/api/admin/faqs/${a.id}`)
        .set(bearer())
        .send({ published: false })
        .expect(200);
      expect((await site()).faqs.map((f) => f.question)).toEqual(['B']);

      await http().delete(`/api/admin/faqs/${b.id}`).set(bearer()).expect(204);
      const rows = await prisma.faq.findMany();
      expect(rows.map((f) => [f.question, f.order])).toEqual([['A', 1]]);
    });
  });
});
