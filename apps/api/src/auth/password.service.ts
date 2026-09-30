import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/** Hash de contraseñas con argon2id. */
@Injectable()
export class PasswordService {
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  /** Verificación contra un hash ficticio: iguala el tiempo de respuesta cuando el email no existe. */
  async verifyDummy(password: string): Promise<false> {
    this.dummyHash ??= this.hash('tamila-dummy-password');
    await argon2.verify(await this.dummyHash, password);
    return false;
  }
}
