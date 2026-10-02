import { ApiError, refreshSession, useSessionStore } from '@/features/auth';
import { adminMediaSchema, type AdminMedia } from '@tamila/shared';

const NETWORK_ERROR = 'No pudimos conectarnos con el servidor. Revisá tu conexión.';

export type UploadMeta = { alt: string; credit?: string | null };
type XhrResult = { status: number; body: unknown };

/**
 * Sube una imagen informando el progreso (0 a 1). `fetch` no informa el progreso de subida,
 * por eso usa XMLHttpRequest con el mismo token y la misma renovación de sesión que apiFetch.
 */
export async function uploadImage(
  file: File,
  meta: UploadMeta,
  onProgress: (fraction: number) => void = () => undefined,
): Promise<AdminMedia> {
  const body = () => {
    const form = new FormData();
    form.append('file', file);
    form.append('alt', meta.alt);
    if (meta.credit) form.append('credit', meta.credit);
    return form;
  };

  let result = await send(body(), useSessionStore.getState().accessToken, onProgress);
  if (result.status === 401) {
    const session = await refreshSession();
    onProgress(0);
    result = await send(body(), session.accessToken, onProgress);
  }
  if (result.status < 200 || result.status >= 300) {
    const error = (result.body ?? {}) as {
      message?: string;
      errors?: Array<{ field: string; message: string }>;
    };
    throw new ApiError(result.status, error.message ?? 'No se pudo subir la imagen', error.errors);
  }
  return adminMediaSchema.parse(result.body);
}

function send(
  body: FormData,
  token: string | null,
  onProgress: (fraction: number) => void,
): Promise<XhrResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      resolve({ status: xhr.status, body: parseJson(xhr.responseText) });
    };
    xhr.onerror = () => reject(new ApiError(0, NETWORK_ERROR));
    xhr.ontimeout = xhr.onerror;
    xhr.send(body);
  });
}

function parseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
