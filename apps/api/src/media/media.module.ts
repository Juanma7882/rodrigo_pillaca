import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { resolve } from 'node:path';
import { ENV, type Env } from '../config/env';

/**
 * Sirve /media desde MEDIA_DIR con caché inmutable (los nombres llevan hash).
 * En producción Caddy sirve el mismo volumen antes de llegar a la API.
 */
@Module({
  imports: [
    ServeStaticModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => [
        {
          rootPath: resolve(env.MEDIA_DIR),
          serveRoot: '/media',
          serveStaticOptions: { index: false, immutable: true, maxAge: '365d', fallthrough: false },
        },
      ],
    }),
  ],
})
export class MediaModule {}
