import { PrismaPg } from '@prisma/adapter-pg';
import { parseEnv } from '@tamila/shared';
import { z } from 'zod';
import { loadDotEnv } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';
import { MEDIA_ENCODING_VERSION } from '../media/media-processor';
import { reoptimizeMedia } from '../media/reoptimize';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  MEDIA_DIR: z.string().min(1).default('./media'),
  MEDIA_ORIGINALS_DIR: z.string().min(1).default('./media-originals'),
});

/**
 * Regenera las variantes de las imágenes con la codificación vigente (v{MEDIA_ENCODING_VERSION}).
 * Uso: `pnpm --filter @tamila/api media:reoptimize [--force]`. Es idempotente.
 */
async function main() {
  loadDotEnv();
  const env = parseEnv(envSchema, process.env);
  const force = process.argv.includes('--force');
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

  try {
    const { processed, skipped } = await reoptimizeMedia(
      prisma,
      { mediaDir: env.MEDIA_DIR, originalsDir: env.MEDIA_ORIGINALS_DIR },
      { force },
    );
    const before = processed.reduce((sum, p) => sum + p.bytesBefore, 0);
    const after = processed.reduce((sum, p) => sum + p.bytesAfter, 0);
    console.log(
      `Codificación v${MEDIA_ENCODING_VERSION}: ${processed.length} imágenes regeneradas` +
        (before ? ` (${mb(before)} → ${mb(after)} en variantes)` : '') +
        '.',
    );
    if (skipped.length) {
      console.log(`Se omitieron ${skipped.length} imágenes sin original (volvé a subirlas):`);
      for (const s of skipped) console.log(`  - ${s.hash} · ${s.alt}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

main().catch((error: unknown) => {
  console.error((error as Error).message);
  process.exit(1);
});
