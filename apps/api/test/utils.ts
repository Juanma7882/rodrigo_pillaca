import type { ModuleMetadata } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
import { AbstractLoader, ExpressLoader } from '@nestjs/serve-static';
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
    // En compile() todavía no hay adaptador HTTP y serve-static elegiría el loader que no hace
    // nada: sin esto, /media no se sirve en los tests.
    .overrideProvider(AbstractLoader)
    .useValue(new ExpressLoader())
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

/** Access token de admin firmado directamente (evita el límite de intentos del login). */
export async function adminToken(
  app: NestExpressApplication,
  options: { expiresIn?: number } = {},
): Promise<string> {
  const jwt = app.get(JwtService);
  return jwt.signAsync(
    { sub: '00000000-0000-4000-8000-000000000001', email: ADMIN.email },
    options,
  );
}

/** Borra todo el contenido del sitio (en el orden que exigen las relaciones). */
export async function resetContent(app: NestExpressApplication) {
  const prisma = app.get(PrismaService);
  await prisma.$transaction([
    prisma.service.updateMany({ data: { featuredProjectId: null } }),
    prisma.project.deleteMany(),
    prisma.service.deleteMany(),
    prisma.siteSettings.deleteMany(),
    prisma.mediaAsset.deleteMany(),
    prisma.processStep.deleteMany(),
    prisma.faq.deleteMany(),
  ]);
}

/** Imagen registrada sin archivos (para tests que no necesitan /media). */
export function fakeMedia(app: NestExpressApplication, name: string) {
  return app.get(PrismaService).mediaAsset.create({
    data: {
      hash: `hash-${name}`,
      path: `/media/${name}-480.webp`,
      alt: `Foto ${name}`,
      width: 480,
      height: 320,
      variants: [{ width: 480, avif: `/media/${name}-480.avif`, webp: `/media/${name}-480.webp` }],
    },
  });
}

export const SETTINGS = {
  heroTitle: 'Construimos, renovamos, terminamos.',
  heroSubtitle: 'Subtítulo',
  whatsappNumber: '5491100000000',
  whatsappDefaultMessage: 'Hola',
  seoTitle: 'TAMILA',
  seoDescription: 'Descripción',
};

export const SERVICE_TEXTS = {
  tagline: 'Bajada',
  summary: 'Resumen',
  description: 'Texto',
  includes: ['Algo'],
};
