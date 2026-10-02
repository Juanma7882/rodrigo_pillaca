import { ApiError } from '@/features/auth';
import { toast } from '@tamila/ui';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

type Options<T extends FieldValues> = {
  /** Campo al que va un 409 (p. ej. el slug repetido). Sin él, el conflicto va a un toast. */
  conflictField?: Path<T>;
  /** Campos de la API que en el formulario se llaman distinto (p. ej. heroImageId → heroImage). */
  rename?: Record<string, Path<T>>;
};

/**
 * Lleva los errores de la API al formulario: los 400 de validación a cada campo (los índices de
 * listas, como `imageIds.2`, al campo de la lista), el 409 al campo indicado y el resto a un toast.
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  { conflictField, rename = {} }: Options<T> = {},
): void {
  if (!(error instanceof ApiError)) {
    toast.error('Ocurrió un error inesperado. Intentá de nuevo.');
    return;
  }
  if (error.status === 400 && error.errors?.length) {
    for (const { field, message } of error.errors) {
      const path = fieldPath(field);
      setError(rename[path] ?? (path as Path<T>), { type: 'server', message });
    }
    return;
  }
  if (error.status === 409 && conflictField) {
    setError(conflictField, { type: 'server', message: error.message });
    return;
  }
  toast.error(error.message);
}

/** `imageIds.2` → `imageIds`; `seoTitle` queda igual. */
export const fieldPath = (field: string) => field.replace(/(\.\d+)+$/, '') || 'root';

export const notifySaved = (what = 'Cambios guardados') =>
  toast.success(what, { description: 'El sitio se actualiza en hasta un minuto.' });
