import type { FieldValues } from 'react-hook-form';

/**
 * Se queda con los campos que el usuario modificó (según `dirtyFields` de React Hook Form), así
 * un PATCH nunca pisa lo que no se tocó. Un campo de lista modificado se envía entero.
 */
export function pickDirty<T extends Record<string, unknown>>(
  values: T,
  dirtyFields: Partial<Record<keyof T, unknown>>,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(dirtyFields) as Array<keyof T>) {
    if (isDirty(dirtyFields[key])) result[key] = values[key];
  }
  return result;
}

const isDirty = (flag: unknown): boolean =>
  flag === true ||
  (Array.isArray(flag) && flag.some(isDirty)) ||
  (typeof flag === 'object' && flag !== null && Object.values(flag as FieldValues).some(isDirty));
