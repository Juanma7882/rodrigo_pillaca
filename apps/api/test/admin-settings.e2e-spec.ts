import type { NestExpressApplication } from '@nestjs/platform-express';
import { adminSettingsSchema, siteContentSchema } from '@tamila/shared';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { adminToken, createTestApp, fakeMedia, resetContent, SETTINGS } from './utils';

describe('Admin · configuración del sitio (e2e)', () => {
  let app: NestExpressApplication;
  let token: string;

  beforeAll(async () => {
    app = await createTestApp();
    token = await adminToken(app);
  });
  beforeEach(async () => {
    await resetContent(app);
    await app.get(PrismaService).siteSettings.create({ data: { id: 1, ...SETTINGS } });
  });
  afterAll(() => app.close());

  const http = () => request(app.getHttpServer());
  const withToken = () => ({ Authorization: `Bearer ${token}` });

  it('sin token responde 401, sin caché', async () => {
    const res = await http().get('/api/admin/settings').expect(401);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('con un token vencido responde 401 y no modifica nada', async () => {
    const expired = await adminToken(app, { expiresIn: -10 });
    await http()
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${expired}`)
      .send({ heroTitle: 'Otro' })
      .expect(401);
    const row = await app.get(PrismaService).siteSettings.findUniqueOrThrow({ where: { id: 1 } });
    expect(row.heroTitle).toBe(SETTINGS.heroTitle);
  });

  it('con token devuelve la configuración completa, sin caché', async () => {
    const res = await http().get('/api/admin/settings').set(withToken()).expect(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(adminSettingsSchema.parse(res.body).whatsappNumber).toBe(SETTINGS.whatsappNumber);
  });

  it('cambiar el WhatsApp se refleja en el endpoint público', async () => {
    const res = await http()
      .patch('/api/admin/settings')
      .set(withToken())
      .send({ whatsappNumber: '5491122334455', instagramUrl: 'https://instagram.com/tamila' })
      .expect(200);
    expect(res.body.whatsappNumber).toBe('5491122334455');

    const pub = await http().get('/api/public/site').expect(200);
    const site = siteContentSchema.parse(pub.body);
    expect(site.settings.whatsappNumber).toBe('5491122334455');
    expect(site.settings.instagramUrl).toBe('https://instagram.com/tamila');
  });

  it('una red vacía se guarda como null', async () => {
    await http()
      .patch('/api/admin/settings')
      .set(withToken())
      .send({ facebookUrl: 'https://facebook.com/tamila' })
      .expect(200);
    const res = await http()
      .patch('/api/admin/settings')
      .set(withToken())
      .send({ facebookUrl: '' })
      .expect(200);
    expect(res.body.facebookUrl).toBeNull();
  });

  it('WhatsApp con formato inválido responde 400 en whatsappNumber', async () => {
    const res = await http()
      .patch('/api/admin/settings')
      .set(withToken())
      .send({ whatsappNumber: '+54 11 2233-4455' })
      .expect(400);
    expect(res.body.errors).toEqual([{ field: 'whatsappNumber', message: expect.any(String) }]);
  });

  it('una imagen inexistente responde 400 en heroImageId', async () => {
    const res = await http()
      .patch('/api/admin/settings')
      .set(withToken())
      .send({ heroImageId: '00000000-0000-4000-8000-0000000000ff' })
      .expect(400);
    expect(res.body.errors[0].field).toBe('heroImageId');
  });

  it('asigna y quita la imagen del hero', async () => {
    const media = await fakeMedia(app, 'hero');
    const set = await http()
      .patch('/api/admin/settings')
      .set(withToken())
      .send({ heroImageId: media.id })
      .expect(200);
    expect(set.body.heroImage.id).toBe(media.id);
    const unset = await http()
      .patch('/api/admin/settings')
      .set(withToken())
      .send({ heroImageId: null })
      .expect(200);
    expect(unset.body.heroImage).toBeNull();
  });

  it('rechaza campos no permitidos', async () => {
    await http().patch('/api/admin/settings').set(withToken()).send({ id: 2 }).expect(400);
  });
});
