import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TURNSTILE_HEADER } from '@tamila/shared';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { Env } from '../config/env';
import { AllExceptionsFilter } from './all-exceptions.filter';

/** Configuración HTTP común a main.ts y a los tests e2e. */
export function setupApp(app: NestExpressApplication, env: Env): void {
  app.setGlobalPrefix('api');
  app.set('trust proxy', env.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: env.CORS_ORIGINS, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TAMILA API')
      .setDescription('API del sitio y del panel de administración de TAMILA')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', in: 'header', name: TURNSTILE_HEADER }, 'turnstile')
      .build();
    SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, config));
  }
}
