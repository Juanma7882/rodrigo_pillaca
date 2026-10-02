import { ApiError, useSessionStore } from '@/features/auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, session } from '@/test/fetch-mock';
import { signIn } from '@/test/render';
import { mockXhr, type XhrRequest, type XhrScript } from '@/test/xhr-mock';
import { MAX_BYTES, shrinkImage } from './shrink';
import { uploadImage } from './upload';

const file = (size: number, name = 'obra.jpg') =>
  new File([new Uint8Array(size)], name, { type: 'image/jpeg', lastModified: 1 });

describe('shrinkImage', () => {
  const canvases: Array<{ width: number; height: number; options?: unknown }> = [];

  beforeEach(() => {
    canvases.length = 0;
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        constructor(
          public width: number,
          public height: number,
        ) {
          canvases.push(this);
        }
        getContext() {
          return { drawImage: vi.fn() };
        }
        async convertToBlob(options: unknown) {
          canvases.at(-1)!.options = options;
          return new Blob([new Uint8Array(1000)], { type: 'image/jpeg' });
        }
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  const bitmap = (width: number, height: number) =>
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width, height, close: vi.fn() })),
    );

  it('achica a 3200 px de lado mayor una foto de 6000 × 4000, sin recortar', async () => {
    bitmap(6000, 4000);
    const result = await shrinkImage(file(14 * 1024 * 1024, 'IMG_1234.JPG'));
    expect([canvases[0]!.width, canvases[0]!.height]).toEqual([3200, 2133]);
    expect(canvases[0]!.options).toEqual({ type: 'image/jpeg', quality: 0.9 });
    expect(result.name).toBe('IMG_1234.jpg');
    expect(result.type).toBe('image/jpeg');
  });

  it('respeta las fotos verticales', async () => {
    bitmap(3000, 4500);
    await shrinkImage(file(5_000_000));
    expect([canvases[0]!.width, canvases[0]!.height]).toEqual([2133, 3200]);
  });

  it('deja tal cual una foto chica y liviana', async () => {
    bitmap(2000, 1500);
    const original = file(3_000_000);
    expect(await shrinkImage(original)).toBe(original);
    expect(canvases).toHaveLength(0);
  });

  it('re-codifica una foto de tamaño normal pero muy pesada', async () => {
    bitmap(3000, 2000);
    await shrinkImage(file(MAX_BYTES + 1));
    expect([canvases[0]!.width, canvases[0]!.height]).toEqual([3000, 2000]);
  });

  it('si el navegador no puede decodificarla, la sube tal cual', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => Promise.reject(new Error('HEIC'))),
    );
    const original = file(20_000_000, 'foto.heic');
    expect(await shrinkImage(original)).toBe(original);
  });
});

const media = {
  id: 'm1',
  alt: 'Living',
  width: 1600,
  height: 1067,
  src: '/media/h-v2-1600.webp',
  variants: [{ width: 480, avif: '/media/h-v2-480.avif', webp: '/media/h-v2-480.webp' }],
  credit: null,
  createdAt: '2026-10-02T12:00:00.000Z',
  sizes: [{ width: 480, avifBytes: 10, webpBytes: 20 }],
  totalBytes: 30,
  usages: [],
};

describe('uploadImage', () => {
  let scripts: XhrScript[];
  let requests: XhrRequest[];
  beforeEach(() => {
    ({ scripts, requests } = mockXhr());
    signIn('A');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('envía el archivo, el alt y el crédito con el token, e informa el progreso', async () => {
    scripts.push({ status: 201, body: media });
    const progress: number[] = [];
    const result = await uploadImage(file(100), { alt: 'Living', credit: 'Foto: TAMILA' }, (p) =>
      progress.push(p),
    );
    expect(result.id).toBe('m1');
    expect(progress).toEqual([0.5, 1]);
    expect(requests[0]!.headers.Authorization).toBe('Bearer A');
    expect(requests[0]!.body.get('alt')).toBe('Living');
    expect(requests[0]!.body.get('credit')).toBe('Foto: TAMILA');
    expect(requests[0]!.body.get('file')).toBeInstanceOf(File);
  });

  it('ante un 401 renueva la sesión y reintenta una vez', async () => {
    scripts.push(
      { status: 401, body: { message: 'No autenticado' } },
      { status: 201, body: media },
    );
    mockFetch({ 'POST /api/auth/refresh': [{ status: 200, body: session('B') }] });
    await uploadImage(file(100), { alt: 'Living' });
    expect(requests.map((r) => r.headers.Authorization)).toEqual(['Bearer A', 'Bearer B']);
    expect(useSessionStore.getState().accessToken).toBe('B');
  });

  it('un error de la API conserva el mensaje y los campos', async () => {
    scripts.push({
      status: 400,
      body: {
        message: 'Los datos enviados no son válidos',
        errors: [{ field: 'file', message: 'Formato inválido' }],
      },
    });
    const error = await uploadImage(file(100), { alt: 'x' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).errors).toEqual([{ field: 'file', message: 'Formato inválido' }]);
  });

  it('un corte de red da un error con status 0', async () => {
    scripts.push({ networkError: true });
    const error = await uploadImage(file(100), { alt: 'x' }).catch((e: unknown) => e);
    expect((error as ApiError).status).toBe(0);
    expect((error as ApiError).message).toMatch(/conectarnos/);
  });
});
