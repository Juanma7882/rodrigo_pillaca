import { Logger } from '@nestjs/common';
import type { MediaAsset as MediaAssetDto } from '@tamila/shared';
import { access, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { MediaAsset, PrismaClient } from '../generated/prisma/client';
import {
  detectImageFormat,
  hashImage,
  processImage,
  type ProcessedImage,
  type ProcessedVariant,
} from './media-processor';

const logger = new Logger('Media');

type ImageMeta = { alt: string; credit?: string | null };

/** Carpetas de almacenamiento: variantes públicas y originales privados. */
export type MediaDirs = { mediaDir: string; originalsDir: string };

/**
 * Procesa (si hace falta) y registra una imagen, guardando también el original. Idempotente: una
 * imagen ya registrada cuyos archivos existen no se vuelve a procesar; se actualizan alt y
 * crédito, y se guarda el original si faltaba (imágenes anteriores a los originales).
 */
export async function storeImage(
  prisma: Pick<PrismaClient, 'mediaAsset'>,
  dirs: MediaDirs,
  input: Buffer,
  meta: ImageMeta,
): Promise<MediaAsset> {
  const hash = hashImage(input);
  const existing = await prisma.mediaAsset.findUnique({ where: { hash } });
  if (existing && (await filesExist(dirs.mediaDir, existing))) {
    const originalPath = existing.originalPath ?? (await saveOriginal(dirs, hash, input));
    return prisma.mediaAsset.update({
      where: { id: existing.id },
      data: { alt: meta.alt, credit: meta.credit ?? null, originalPath },
    });
  }

  const processed = await processImage(input, dirs.mediaDir);
  logOverBudget(processed);
  const data = {
    ...variantFields(processed),
    alt: meta.alt,
    credit: meta.credit ?? null,
    originalPath: await saveOriginal(dirs, hash, input),
  };
  return prisma.mediaAsset.upsert({
    where: { hash: processed.hash },
    create: { hash: processed.hash, ...data },
    update: data,
  });
}

/** Columnas de MediaAsset que salen del procesamiento. */
export function variantFields(processed: ProcessedImage) {
  return {
    path: processed.path,
    width: processed.width,
    height: processed.height,
    variants: processed.variants,
    encodingVersion: processed.encodingVersion,
  };
}

export function logOverBudget(processed: ProcessedImage) {
  for (const o of processed.overBudget) {
    logger.warn(
      `Imagen ${processed.hash}: ${o.format} de ${o.width} px pesa ${kb(o.bytes)} y supera ` +
        `su presupuesto de ${kb(o.budget)} aun en la calidad mínima`,
    );
  }
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

/** Guarda el original tal cual (privado) y devuelve su ruta relativa a la carpeta de originales. */
async function saveOriginal(dirs: MediaDirs, hash: string, input: Buffer): Promise<string | null> {
  const format = await detectImageFormat(input);
  if (!format) return null;
  const name = `${hash}.${format}`;
  await mkdir(dirs.originalsDir, { recursive: true });
  await writeFile(join(dirs.originalsDir, name), input);
  return name;
}

/** Borra los archivos de las variantes y, si se indica, el original. No falla si ya no están. */
export async function removeImageFiles(
  dirs: MediaDirs,
  asset: Pick<MediaAsset, 'variants' | 'originalPath'>,
  { keepOriginal = false } = {},
): Promise<void> {
  const files = variantFiles(dirs.mediaDir, asset.variants as ProcessedVariant[]);
  if (!keepOriginal && asset.originalPath) files.push(join(dirs.originalsDir, asset.originalPath));
  await Promise.all(files.map((file) => rm(file, { force: true })));
}

function variantFiles(mediaDir: string, variants: ProcessedVariant[]): string[] {
  return variants
    .flatMap((v) => [v.avif, v.webp])
    .map((p) => join(mediaDir, p.replace('/media/', '')));
}

async function filesExist(mediaDir: string, asset: MediaAsset): Promise<boolean> {
  try {
    await Promise.all(
      variantFiles(mediaDir, asset.variants as ProcessedVariant[]).map((f) => access(f)),
    );
    return true;
  } catch {
    return false;
  }
}

/** Convierte un MediaAsset de la base al formato público compartido (sin pesos ni originales). */
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
    variants: (asset.variants as ProcessedVariant[]).map(({ width, avif, webp }) => ({
      width,
      avif,
      webp,
    })),
    credit: asset.credit,
  };
}
