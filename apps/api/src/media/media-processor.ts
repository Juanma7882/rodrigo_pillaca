import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

/** Anchos de las variantes responsive. */
export const MEDIA_WIDTHS = [480, 960, 1600] as const;
export const MEDIA_PUBLIC_PREFIX = '/media';

export type ProcessedVariant = { width: number; avif: string; webp: string };
export type ProcessedImage = {
  hash: string;
  /** Dimensiones de la variante más grande. */
  width: number;
  height: number;
  /** WebP de la variante más grande: imagen de respaldo. */
  path: string;
  variants: ProcessedVariant[];
};

/**
 * Genera variantes AVIF + WebP en 480/960/1600 px (sin agrandar imágenes chicas) con nombres
 * basados en el hash del contenido, así las URLs son inmutables y cacheables para siempre.
 */
export async function processImage(input: Buffer, mediaDir: string): Promise<ProcessedImage> {
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 20);
  const source = sharp(input).rotate();
  const { width: originalWidth = 0 } = await source.metadata();
  if (!originalWidth) throw new Error('No se pudo leer el ancho de la imagen');

  const widths = [...new Set(MEDIA_WIDTHS.map((w) => Math.min(w, originalWidth)))];
  await mkdir(mediaDir, { recursive: true });

  const variants: ProcessedVariant[] = [];
  let largest = { width: 0, height: 0 };
  for (const width of widths) {
    const resized = source.clone().resize({ width, withoutEnlargement: true });
    const [avif, webp] = await Promise.all([
      resized.clone().avif({ quality: 50, effort: 2 }).toBuffer({ resolveWithObject: true }),
      resized.clone().webp({ quality: 78 }).toBuffer({ resolveWithObject: true }),
    ]);
    const avifName = `${hash}-${width}.avif`;
    const webpName = `${hash}-${width}.webp`;
    await Promise.all([
      writeFile(join(mediaDir, avifName), avif.data),
      writeFile(join(mediaDir, webpName), webp.data),
    ]);
    variants.push({
      width,
      avif: `${MEDIA_PUBLIC_PREFIX}/${avifName}`,
      webp: `${MEDIA_PUBLIC_PREFIX}/${webpName}`,
    });
    if (webp.info.width > largest.width)
      largest = { width: webp.info.width, height: webp.info.height };
  }

  return {
    hash,
    width: largest.width,
    height: largest.height,
    path: variants.at(-1)!.webp,
    variants,
  };
}
