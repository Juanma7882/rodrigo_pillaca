import { PrismaPg } from '@prisma/adapter-pg';
import { parseEnv } from '@tamila/shared';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { loadDotEnv } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';
import { storeImage } from '../media/media-store';
import { faqs, processSteps, sampleProjects, services, siteDefaults } from './content-data';

const SEED_MEDIA_DIR = resolve(__dirname, '../../../prisma/seed-media');

const emptyToNull = (value: unknown) => (value === '' ? null : value);
const seedEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  MEDIA_DIR: z.string().min(1).default('./media'),
  SEED_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d*$/, 'SEED_WHATSAPP_NUMBER: solo dígitos, formato internacional sin +')
    .default(''),
  SEED_INSTAGRAM_URL: z.preprocess(emptyToNull, z.url().nullable().default(null)),
  SEED_FACEBOOK_URL: z.preprocess(emptyToNull, z.url().nullable().default(null)),
  SEED_TIKTOK_URL: z.preprocess(emptyToNull, z.url().nullable().default(null)),
  SEED_BUSINESS_HOURS: z.preprocess(emptyToNull, z.string().nullable().default(null)),
  SEED_SAMPLE_PROJECTS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

/**
 * Carga el contenido inicial del sitio. Idempotente y no destructivo: solo crea lo que falta,
 * así volver a ejecutarlo no pisa lo que se haya editado desde el admin.
 */
async function main() {
  loadDotEnv();
  const env = parseEnv(seedEnvSchema, process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });
  const credits = await loadCredits();

  const image = async (file: string, alt: string) =>
    storeImage(prisma, env.MEDIA_DIR, await readFile(resolve(SEED_MEDIA_DIR, file)), {
      alt,
      credit: credits.get(file) ?? null,
    });
  const altOf = new Map(services.flatMap((s) => s.images.map((i) => [i.file, i.alt] as const)));
  const imageByFile = (file: string) => image(file, altOf.get(file) ?? '');

  try {
    const ogImage = await imageByFile(siteDefaults.ogImageFile);
    const heroImage = await image(siteDefaults.heroImage.file, siteDefaults.heroImage.alt);
    const settings = await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        heroTitle: siteDefaults.heroTitle,
        heroSubtitle: siteDefaults.heroSubtitle,
        whatsappNumber: env.SEED_WHATSAPP_NUMBER,
        whatsappDefaultMessage: siteDefaults.whatsappDefaultMessage,
        instagramUrl: env.SEED_INSTAGRAM_URL,
        facebookUrl: env.SEED_FACEBOOK_URL,
        tiktokUrl: env.SEED_TIKTOK_URL,
        businessHours: env.SEED_BUSINESS_HOURS,
        footerText: siteDefaults.footerText,
        seoTitle: siteDefaults.seoTitle,
        seoDescription: siteDefaults.seoDescription,
        ogImageId: ogImage.id,
        heroImageId: heroImage.id,
      },
    });
    // Configuración creada antes de existir la foto del hero: solo se completa el campo vacío.
    if (!settings.heroImageId) {
      await prisma.siteSettings.update({ where: { id: 1 }, data: { heroImageId: heroImage.id } });
    }

    for (const [index, step] of processSteps.entries()) {
      await prisma.processStep.upsert({
        where: { order: index + 1 },
        update: {},
        create: { order: index + 1, ...step },
      });
    }
    for (const [index, faq] of faqs.entries()) {
      await prisma.faq.upsert({
        where: { order: index + 1 },
        update: {},
        create: { order: index + 1, ...faq },
      });
    }

    for (const [index, service] of services.entries()) {
      const media = [];
      for (const img of service.images) media.push(await image(img.file, img.alt));
      const saved = await prisma.service.upsert({
        where: { slug: service.slug },
        update: {},
        create: {
          slug: service.slug,
          name: service.name,
          order: index + 1,
          tagline: service.tagline,
          summary: service.summary,
          description: service.description,
          includes: service.includes,
          coverImageId: media[0]?.id,
        },
      });
      await prisma.serviceImage.createMany({
        data: media.map((m, order) => ({ serviceId: saved.id, mediaId: m.id, order })),
        skipDuplicates: true,
      });
    }
    console.log(
      `Contenido listo: ${services.length} servicios, ${processSteps.length} pasos, ${faqs.length} preguntas.`,
    );

    if (env.SEED_SAMPLE_PROJECTS) {
      for (const [index, sample] of sampleProjects.entries()) {
        const service = await prisma.service.findUniqueOrThrow({
          where: { slug: sample.serviceSlug },
        });
        const existing = await prisma.project.findFirst({
          where: { title: sample.title, serviceId: service.id },
        });
        if (existing) continue;
        const project = await prisma.project.create({
          data: {
            title: sample.title,
            year: sample.year,
            location: sample.location,
            description: sample.description,
            order: index + 1,
            serviceId: service.id,
            beforeImageId: sample.beforeFile ? (await imageByFile(sample.beforeFile)).id : null,
            afterImageId: sample.afterFile ? (await imageByFile(sample.afterFile)).id : null,
          },
        });
        for (const [order, file] of sample.imageFiles.entries()) {
          const media = await imageByFile(file);
          await prisma.projectImage.create({
            data: { projectId: project.id, mediaId: media.id, order },
          });
        }
        if (sample.featured && !service.featuredProjectId) {
          await prisma.service.update({
            where: { id: service.id },
            data: { featuredProjectId: project.id },
          });
        }
      }
      console.log(`Trabajos de ejemplo listos: ${sampleProjects.length}.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

/** Créditos de las fotos de muestra desde manifest.json. */
async function loadCredits(): Promise<Map<string, string>> {
  const manifest = JSON.parse(
    await readFile(resolve(SEED_MEDIA_DIR, 'manifest.json'), 'utf8'),
  ) as Array<{
    file: string;
    author: string;
    license: string;
  }>;
  return new Map(
    manifest.map((m) => [m.file, `Foto: ${m.author} · ${m.license} · Wikimedia Commons`]),
  );
}

main().catch((error: unknown) => {
  console.error((error as Error).message);
  process.exit(1);
});
