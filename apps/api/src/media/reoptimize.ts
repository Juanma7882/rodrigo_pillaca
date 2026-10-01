import { existsSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { MediaAsset, PrismaClient } from '../generated/prisma/client';
import { MEDIA_ENCODING_VERSION, processImage, type ProcessedVariant } from './media-processor';
import { logOverBudget, variantFields, type MediaDirs } from './media-store';

export type ReoptimizeSummary = {
  /** Imágenes regeneradas, con el peso total de sus variantes antes y después. */
  processed: { id: string; hash: string; bytesBefore: number; bytesAfter: number }[];
  /** Imágenes sin original disponible: no se pueden regenerar sin perder calidad. */
  skipped: { id: string; hash: string; alt: string }[];
};

/**
 * Regenera las variantes desde el original con la codificación vigente. Por defecto solo las
 * imágenes con una versión de codificación anterior; con `force`, todas (mismas URLs si la
 * versión no cambió). Conserva el id, así que ningún uso cambia. Procesa de a una imagen.
 */
export async function reoptimizeMedia(
  prisma: Pick<PrismaClient, 'mediaAsset'>,
  dirs: MediaDirs,
  { force = false } = {},
): Promise<ReoptimizeSummary> {
  const assets = await prisma.mediaAsset.findMany({
    where: force ? {} : { encodingVersion: { lt: MEDIA_ENCODING_VERSION } },
    orderBy: { createdAt: 'asc' },
  });

  const summary: ReoptimizeSummary = { processed: [], skipped: [] };
  for (const asset of assets) {
    const original = asset.originalPath && join(dirs.originalsDir, asset.originalPath);
    if (!original || !existsSync(original)) {
      summary.skipped.push({ id: asset.id, hash: asset.hash, alt: asset.alt });
      continue;
    }

    const processed = await processImage(await readFile(original), dirs.mediaDir);
    logOverBudget(processed);
    await prisma.mediaAsset.update({ where: { id: asset.id }, data: variantFields(processed) });
    await removeReplacedFiles(dirs.mediaDir, asset, processed.variants);
    summary.processed.push({
      id: asset.id,
      hash: asset.hash,
      bytesBefore: totalBytes(asset.variants as ProcessedVariant[]),
      bytesAfter: totalBytes(processed.variants),
    });
  }
  return summary;
}

/** Borra los archivos anteriores que no se volvieron a escribir con el mismo nombre. */
async function removeReplacedFiles(
  mediaDir: string,
  asset: MediaAsset,
  current: ProcessedVariant[],
): Promise<void> {
  const keep = new Set(current.flatMap((v) => [v.avif, v.webp]));
  const stale = (asset.variants as ProcessedVariant[])
    .flatMap((v) => [v.avif, v.webp])
    .filter((path) => !keep.has(path));
  await Promise.all(
    stale.map((path) => rm(join(mediaDir, path.replace('/media/', '')), { force: true })),
  );
}

const totalBytes = (variants: Partial<ProcessedVariant>[]) =>
  variants.reduce((sum, v) => sum + (v.avifBytes ?? 0) + (v.webpBytes ?? 0), 0);
