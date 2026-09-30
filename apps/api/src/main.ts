import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { setupApp } from './common/setup-app';
import { loadDotEnv, readEnv, type Env } from './config/env';

async function bootstrap() {
  loadDotEnv();
  let env: Env;
  try {
    env = readEnv();
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  setupApp(app, env);
  await app.listen(env.API_PORT, '0.0.0.0');
}

void bootstrap();
