import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { ADMIN, createTestApp, refreshCookie, resetAdmin, VALID_TURNSTILE } from './utils';

describe('Autenticación del admin (e2e)', () => {
  let app: NestExpressApplication;

  const login = (body: object = ADMIN, token = VALID_TURNSTILE) =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .set('cf-turnstile-response', token)
      .send(body);

  // App nueva por test: el contador del rate limit arranca en cero.
  beforeEach(async () => {
    app = await createTestApp();
    await resetAdmin(app);
  });

  afterEach(() => app.close());

  describe('POST /api/auth/login', () => {
    it('con credenciales válidas devuelve el access token y la cookie segura', async () => {
      const res = await login().expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.expiresIn).toBe(900);
      expect(res.body.admin).toEqual({
        id: expect.any(String),
        email: ADMIN.email,
        createdAt: expect.any(String),
      });
      expect(JSON.stringify(res.body)).not.toMatch(/password|hash/i);

      const cookie = ([] as string[])
        .concat(res.headers['set-cookie'] ?? [])
        .find((c) => c.startsWith('tamila_rt='));
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/Secure/);
      expect(cookie).toMatch(/SameSite=Strict/);
      expect(cookie).toMatch(/Path=\/api\/auth/);
    });

    it('responde el mismo 401 genérico para email inexistente y contraseña incorrecta', async () => {
      const unknown = await login({ email: 'nadie@tamila.test', password: 'x' }).expect(401);
      const wrong = await login({ email: ADMIN.email, password: 'incorrecta' }).expect(401);
      expect(unknown.body.message).toBe('Email o contraseña incorrectos');
      expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('rechaza con 403 sin un token de Turnstile válido', async () => {
      await login(ADMIN, 'token-falso').expect(403);
    });

    it('responde 429 al superar 5 intentos por minuto', async () => {
      for (let i = 0; i < 5; i++)
        await login({ email: ADMIN.email, password: 'incorrecta' }).expect(401);
      const res = await login().expect(429);
      expect(res.body.message).toMatch(/Demasiados intentos/);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rota el refresh token y emite un nuevo access token', async () => {
      const first = refreshCookie((await login()).headers['set-cookie']);
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', first!)
        .expect(200);
      const second = refreshCookie(res.headers['set-cookie']);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(second).toBeDefined();
      expect(second).not.toBe(first);
    });

    it('reutilizar un token rotado responde 401 y revoca todas las sesiones', async () => {
      const first = refreshCookie((await login()).headers['set-cookie'])!;
      const other = refreshCookie((await login()).headers['set-cookie'])!;
      const rotated = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', first)
        .expect(200);
      const current = refreshCookie(rotated.headers['set-cookie'])!;

      await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', first).expect(401);

      // El token vigente y la otra sesión quedaron revocados.
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', current)
        .expect(401);
      await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', other).expect(401);
      const active = await app
        .get(PrismaService)
        .refreshToken.count({ where: { revokedAt: null } });
      expect(active).toBe(0);
    });

    it('sin cookie responde 401', async () => {
      await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
    });
  });

  describe('POST /api/auth/logout y GET /api/auth/me', () => {
    it('después del logout el refresh token ya no sirve', async () => {
      const cookie = refreshCookie((await login()).headers['set-cookie'])!;
      await request(app.getHttpServer()).post('/api/auth/logout').set('Cookie', cookie).expect(204);
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookie)
        .expect(401);
    });

    it('/me devuelve el perfil sin la contraseña', async () => {
      const { accessToken } = (await login()).body;
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      expect(res.body.email).toBe(ADMIN.email);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('/me sin token o con token inválido responde 401', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
      await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer basura')
        .expect(401);
    });
  });
});
