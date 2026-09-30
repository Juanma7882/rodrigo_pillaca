import { Global, Module } from '@nestjs/common';
import { ENV, readEnv } from './env';

@Global()
@Module({
  providers: [{ provide: ENV, useFactory: readEnv }],
  exports: [ENV],
})
export class ConfigModule {}
