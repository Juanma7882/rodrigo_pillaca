import type { PrismaClient } from '../generated/prisma/client';
import { fieldError } from './http-errors';

/** Campo del body → id de imagen (o lista de ids, para galerías). */
export type MediaRefs = Record<string, string | string[] | null | undefined>;

/**
 * Verifica que existan todas las imágenes referenciadas. Si falta alguna responde 400 en el
 * campo correspondiente (en galerías, con el índice: `imageIds.2`).
 */
export async function assertMediaExists(
  prisma: Pick<PrismaClient, 'mediaAsset'>,
  refs: MediaRefs,
): Promise<void> {
  const ids = Object.values(refs).flatMap((value) => (value ? [value].flat() : []));
  if (ids.length === 0) return;

  const found = await prisma.mediaAsset.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true },
  });
  const existing = new Set(found.map((m) => m.id));

  for (const [field, value] of Object.entries(refs)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const missing = value.findIndex((id) => !existing.has(id));
      if (missing >= 0) throw fieldError(`${field}.${missing}`, 'La imagen no existe');
    } else if (!existing.has(value)) {
      throw fieldError(field, 'La imagen no existe');
    }
  }
}
