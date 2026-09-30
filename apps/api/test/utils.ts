import type { ModuleMetadata } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/common/setup-app';
import { readEnv } from '../src/config/env';
import { PrismaService } from '../src/prisma/prisma.service';
import { TurnstileService } from '../src/turnstile/turnstile.service';

export const VALID_TURNSTILE = 'token-valido';

/** Turnstile falso: evita llamar a Cloudflare desde los tests. */
export const fakeTurnstile = { verify: async (token?: string) => token === VALID_TURNSTILE };

export async function createTestApp(extra: ModuleMetadata = {}): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule, ...(extra.imports ?? [])],
    controllers: extra.controllers ?? [],
  })
    .overrideProvider(TurnstileService)
    .useValue(fakeTurnstile)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  setupApp(app, readEnv());
  await app.init();
  return app;
}

export const ADMIN = { email: 'admin@tamila.test', password: 'clave-de-pruebas-segura' };

export async function resetAdmin(app: NestExpressApplication) {
  const prisma = app.get(PrismaService);
  await prisma.refreshToken.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.adminUser.create({
    data: { email: ADMIN.email, passwordHash: await argon2.hash(ADMIN.password) },
  });
}

/** Extrae el valor de la cookie del refresh token de una respuesta. */
export function refreshCookie(setCookie: string[] | string | undefined): string | undefined {
  const cookies = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  return cookies.find((c) => c.startsWith('tamila_rt='))?.split(';')[0];
}
