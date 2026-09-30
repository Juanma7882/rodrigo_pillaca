import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from './config/config.module';
import { ENV, type Env } from './config/env';
import { HealthModule } from './health/health.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicContentModule } from './public-content/public-content.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => ({
        pinoHttp: {
          level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["cf-turnstile-response"]',
              'res.headers["set-cookie"]',
              '*.password',
              '*.passwordHash',
            ],
            censor: '[oculto]',
          },
          transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
        },
      }),
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MediaModule,
    PublicContentModule,
  ],
})
export class AppModule {}
