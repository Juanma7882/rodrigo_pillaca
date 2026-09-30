import { PrismaPg } from '@prisma/adapter-pg';
import { parseEnv, seedEnvSchema } from '@tamila/shared';
import * as argon2 from 'argon2';
import { loadDotEnv } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

/** Crea o actualiza el administrador inicial. Idempotente: se puede ejecutar varias veces. */
async function main() {
  loadDotEnv();
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = parseEnv(seedEnvSchema, process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  try {
    const email = ADMIN_EMAIL.trim().toLowerCase();
    const passwordHash = await argon2.hash(ADMIN_PASSWORD, { type: argon2.argon2id });
    await prisma.adminUser.upsert({
      where: { email },
      create: { email, passwordHash },
      update: { passwordHash },
    });
    console.log(`Administrador listo: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error((error as Error).message);
  process.exit(1);
});
