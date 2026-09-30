import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { ENV, type Env } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(ENV) env: Env) {
    // Conexión perezosa: la API arranca aunque la base no responda, y /health lo informa.
    super({
      adapter: new PrismaPg({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 3000 }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
