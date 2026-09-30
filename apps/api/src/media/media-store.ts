import type { MediaAsset as MediaAssetDto } from '@tamila/shared';
import { createHash } from 'node:crypto';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import type { MediaAsset, PrismaClient } from '../generated/prisma/client';
import { processImage, type ProcessedVariant } from './media-processor';

type ImageMeta = { alt: string; credit?: string | null };

/**
 * Procesa (si hace falta) y registra una imagen. Idempotente: una imagen ya registrada
 * cuyos archivos existen no se vuelve a procesar; solo se actualizan alt y crédito.
 */
export async function storeImage(
  prisma: Pick<PrismaClient, 'mediaAsset'>,
  mediaDir: string,
  input: Buffer,
  meta: ImageMeta,
): Promise<MediaAsset> {
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 20);
  const existing = await prisma.mediaAsset.findUnique({ where: { hash } });
  if (existing && (await filesExist(mediaDir, existing))) {
    return prisma.mediaAsset.update({
      where: { id: existing.id },
      data: { alt: meta.alt, credit: meta.credit ?? null },
    });
  }

  const processed = await processImage(input, mediaDir);
  const data = {
    path: processed.path,
    alt: meta.alt,
    width: processed.width,
    height: processed.height,
    variants: processed.variants,
    credit: meta.credit ?? null,
  };
  return prisma.mediaAsset.upsert({
    where: { hash: processed.hash },
    create: { hash: processed.hash, ...data },
    update: data,
  });
}

async function filesExist(mediaDir: string, asset: MediaAsset): Promise<boolean> {
  const variants = asset.variants as ProcessedVariant[];
  try {
    await Promise.all(
      variants
        .flatMap((v) => [v.avif, v.webp])
        .map((p) => access(join(mediaDir, p.replace('/media/', '')))),
    );
    return true;
  } catch {
    return false;
  }
}

/** Convierte un MediaAsset de la base al formato público compartido. */
export function toMediaDto(asset: MediaAsset): MediaAssetDto;
export function toMediaDto(asset: MediaAsset | null | undefined): MediaAssetDto | null;
export function toMediaDto(asset: MediaAsset | null | undefined): MediaAssetDto | null {
  if (!asset) return null;
  return {
    id: asset.id,
    alt: asset.alt,
    width: asset.width,
    height: asset.height,
    src: asset.path,
    variants: asset.variants as ProcessedVariant[],
    credit: asset.credit,
  };
}
