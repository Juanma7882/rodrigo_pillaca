import { ApiError } from '@/features/auth';
import type { AdminMedia } from '@tamila/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { invalidateMedia } from './api/media';
import { shrinkImage } from './api/shrink';
import { uploadImage } from './api/upload';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(',');
export const FORMAT_HELP =
  'Formato no admitido: usá JPEG, PNG, WebP o AVIF. Si es una foto HEIC del iPhone, exportala como JPEG (en Fotos: Compartir → Opciones → Más compatible).';

export type UploadStatus = 'pendiente' | 'subiendo' | 'procesando' | 'lista' | 'error';

export type UploadItem = {
  key: string;
  file: File;
  previewUrl: string;
  alt: string;
  status: UploadStatus;
  /** 0 a 1 durante la subida. */
  progress: number;
  error?: string;
  media?: AdminMedia;
};

/** "IMG_2034-living final.jpg" → "IMG 2034 living final" (sugerencia de texto alternativo). */
export const altFromName = (name: string) =>
  name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

let sequence = 0;

/**
 * Cola de subida: cada foto lleva su texto alternativo y se sube de a una (la API procesa cada
 * imagen en varios segundos). Una foto que falla queda con su error y se puede reintentar.
 */
export function useUploadQueue({ onUploaded }: { onUploaded?: (media: AdminMedia) => void } = {}) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<UploadItem[]>([]);
  const itemsRef = useRef(items);
  const running = useRef(false);
  const onUploadedRef = useRef(onUploaded);
  // El bucle de subida es asíncrono: lee siempre la cola y el callback más recientes.
  useLayoutEffect(() => {
    itemsRef.current = items;
    onUploadedRef.current = onUploaded;
  });

  const patch = useCallback((key: string, changes: Partial<UploadItem>) => {
    setItems((current) => current.map((i) => (i.key === key ? { ...i, ...changes } : i)));
  }, []);

  // Libera las vistas previas al desmontar.
  useEffect(
    () => () => itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl)),
    [],
  );

  const addFiles = useCallback((files: FileList | File[]) => {
    const added = Array.from(files).map<UploadItem>((file) => {
      const accepted = ACCEPTED_TYPES.includes(file.type);
      return {
        key: `u${++sequence}`,
        file,
        previewUrl: URL.createObjectURL(file),
        alt: altFromName(file.name),
        status: accepted ? 'pendiente' : 'error',
        progress: 0,
        error: accepted ? undefined : FORMAT_HELP,
      };
    });
    setItems((current) => [...current, ...added]);
  }, []);

  const start = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((i) => i.status === 'pendiente');
        if (!next) break;
        if (!next.alt.trim()) {
          patch(next.key, { status: 'error', error: 'Escribí un texto alternativo' });
          continue;
        }
        patch(next.key, { status: 'subiendo', progress: 0, error: undefined });
        // Evita que el bucle vuelva a tomar este ítem antes del próximo render.
        itemsRef.current = itemsRef.current.map((i) =>
          i.key === next.key ? { ...i, status: 'subiendo' } : i,
        );
        try {
          const file = await shrinkImage(next.file);
          const media = await uploadImage(file, { alt: next.alt.trim() }, (progress) =>
            patch(next.key, progress >= 1 ? { status: 'procesando', progress } : { progress }),
          );
          patch(next.key, { status: 'lista', progress: 1, media });
          onUploadedRef.current?.(media);
        } catch (error) {
          const message =
            error instanceof ApiError
              ? (error.errors?.[0]?.message ?? error.message)
              : 'No se pudo subir la foto';
          patch(next.key, { status: 'error', error: message });
        }
      }
      await invalidateMedia(queryClient);
    } finally {
      running.current = false;
    }
  }, [patch, queryClient]);

  const retry = useCallback(
    (key: string) => {
      const item = itemsRef.current.find((i) => i.key === key);
      // Un formato no admitido no se arregla reintentando.
      if (!item || !ACCEPTED_TYPES.includes(item.file.type)) return;
      patch(key, { status: 'pendiente', error: undefined, progress: 0 });
      itemsRef.current = itemsRef.current.map((i) =>
        i.key === key ? { ...i, status: 'pendiente' } : i,
      );
      void start();
    },
    [patch, start],
  );

  const remove = useCallback((key: string) => {
    setItems((current) => {
      const item = current.find((i) => i.key === key);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return current.filter((i) => i.key !== key);
    });
  }, []);

  const clearDone = useCallback(() => {
    setItems((current) => {
      current.filter((i) => i.status === 'lista').forEach((i) => URL.revokeObjectURL(i.previewUrl));
      return current.filter((i) => i.status !== 'lista');
    });
  }, []);

  const setAlt = useCallback((key: string, alt: string) => patch(key, { alt }), [patch]);

  return {
    items,
    addFiles,
    setAlt,
    start,
    retry,
    remove,
    clearDone,
    pendingCount: items.filter((i) => i.status === 'pendiente').length,
    busy: items.some((i) => i.status === 'subiendo' || i.status === 'procesando'),
  };
}
