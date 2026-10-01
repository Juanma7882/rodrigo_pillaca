import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Los tests e2e usan siempre la base de pruebas, nunca la de desarrollo.
const rootEnv = resolve(__dirname, '../../../.env');
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
if (!process.env.DATABASE_URL_TEST) throw new Error('Falta DATABASE_URL_TEST para los tests e2e');
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.NODE_ENV = 'test';

// Imágenes en carpetas temporales propias de cada archivo de tests (nunca en las de desarrollo).
const mediaRoot = mkdtempSync(join(tmpdir(), 'tamila-e2e-'));
process.env.MEDIA_DIR = join(mediaRoot, 'media');
process.env.MEDIA_ORIGINALS_DIR = join(mediaRoot, 'media-originals');
