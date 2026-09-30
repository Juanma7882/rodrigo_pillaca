import { Controller, Get } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import request from 'supertest';
import { createTestApp } from './utils';

@Controller('boom')
class BoomController {
  @Get()
  boom(): never {
    throw new Error('detalle interno secreto');
  }
}

describe('Plataforma de la API (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp({ controllers: [BoomController] });
  });

  afterAll(() => app.close());

  it('GET /api/health responde 200 con la base disponible', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.details.database.status).toBe('up');
  });

  it('un error inesperado responde 500 sin exponer detalles internos', async () => {
    const res = await request(app.getHttpServer()).get('/api/boom').expect(500);
    expect(res.body).toEqual({
      statusCode: 500,
      message: expect.stringMatching(/error inesperado/i),
      path: '/api/boom',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/secreto|at |stack/);
  });

  it('una ruta inexistente responde 404 en español', async () => {
    const res = await request(app.getHttpServer()).get('/api/no-existe').expect(404);
    expect(res.body).toEqual({
      statusCode: 404,
      message: 'Recurso no encontrado',
      path: '/api/no-existe',
    });
  });

  it('valida el cuerpo e indica los campos inválidos', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('cf-turnstile-response', 'token-valido')
      .send({ password: 'x' })
      .expect(400);
    expect(res.body.errors).toEqual([{ field: 'email', message: 'El email es obligatorio' }]);
  });

  it('publica Swagger fuera de producción', async () => {
    await request(app.getHttpServer()).get('/api/docs').expect(200);
  });

  it('CORS solo habilita los orígenes configurados', async () => {
    const allowed = await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'http://localhost:4174');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:4174');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');

    const denied = await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'https://malicioso.com');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Swagger en producción (e2e)', () => {
  it('no expone la documentación', async () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const app = await createTestApp();
    try {
      await request(app.getHttpServer()).get('/api/docs').expect(404);
    } finally {
      await app.close();
      process.env.NODE_ENV = previous;
    }
  });
});

describe('Health con la base caída (e2e)', () => {
  it('responde 503', async () => {
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://nadie:nada@127.0.0.1:1/nada';
    const app = await createTestApp();
    try {
      await request(app.getHttpServer()).get('/api/health').expect(503);
    } finally {
      await app.close();
      process.env.DATABASE_URL = previous;
    }
  });
});

describe('Configuración al arrancar', () => {
  it('termina con un error que nombra la variable inválida', () => {
    const result = spawnSync(process.execPath, [resolve(__dirname, '../dist/src/main.js')], {
      env: { ...process.env, JWT_ACCESS_SECRET: '' },
      encoding: 'utf8',
      timeout: 15_000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('JWT_ACCESS_SECRET');
  });
});
