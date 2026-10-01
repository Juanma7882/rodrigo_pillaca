import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';

/** Anchos de las variantes responsive. */
export const MEDIA_WIDTHS = [480, 960, 1600] as const;
export const MEDIA_PUBLIC_PREFIX = '/media';

/**
 * Versión de la codificación. Va en el nombre de los archivos: subirla y correr
 * `media:reoptimize` genera URLs nuevas, así la caché inmutable de /media nunca sirve una vieja.
 */
export const MEDIA_ENCODING_VERSION = 2;

/**
 * Peso máximo por ancho nominal. Se garantiza en AVIF (lo que descargan casi todos los
 * navegadores), que además no puede pesar más que la WebP. La WebP de respaldo lo usa como
 * objetivo, pero con fotos muy detalladas puede quedar por encima en el piso de calidad.
 */
export const MEDIA_BUDGET: Record<(typeof MEDIA_WIDTHS)[number], number> = {
  480: 40 * 1024,
  960: 120 * 1024,
  1600: 250 * 1024,
};

/** Escalones de calidad: se usa el primero que entra en el presupuesto; el último es el piso. */
export const WEBP_QUALITIES = [78, 70, 62, 55] as const;
export const AVIF_QUALITIES = [50, 44, 38, 32] as const;

/** Límite de píxeles de entrada (≈ 40 MP): evita bombas de descompresión. */
export const MAX_INPUT_PIXELS = 40_000_000;

export type ProcessedVariant = {
  width: number;
  avif: string;
  webp: string;
  avifBytes: number;
  webpBytes: number;
};

/** Variante que, aun en el piso de calidad, superó su presupuesto (se informa en los logs). */
export type OverBudget = { width: number; format: 'avif' | 'webp'; bytes: number; budget: number };

export type ProcessedImage = {
  hash: string;
  /** Dimensiones de la variante más grande. */
  width: number;
  height: number;
  /** WebP de la variante más grande: imagen de respaldo. */
  path: string;
  variants: ProcessedVariant[];
  encodingVersion: number;
  overBudget: OverBudget[];
};

export const hashImage = (input: Buffer) =>
  createHash('sha256').update(input).digest('hex').slice(0, 20);

export const openImage = (input: Buffer) => sharp(input, { limitInputPixels: MAX_INPUT_PIXELS });

/** Formatos aceptados, con la extensión con que se guarda el original. */
export type ImageFormat = 'jpg' | 'png' | 'webp' | 'avif';

/**
 * Detecta el formato por el contenido (no por la extensión ni el tipo declarado). Devuelve null
 * si no es una imagen aceptada; HEIC (iPhone) también da null: sharp no la decodifica.
 */
export async function detectImageFormat(input: Buffer): Promise<ImageFormat | null> {
  try {
    const { format, compression } = await openImage(input).metadata();
    if (format === 'heif') return compression === 'av1' ? 'avif' : null;
    const formats: Partial<Record<string, ImageFormat>> = { jpeg: 'jpg', png: 'png', webp: 'webp' };
    return formats[format ?? ''] ?? null;
  } catch {
    return null;
  }
}

/**
 * Genera variantes AVIF + WebP en 480/960/1600 px (sin agrandar imágenes chicas), con calidad
 * adaptativa para respetar el presupuesto de peso, y nombres `<hash>-v<N>-<ancho>.<ext>`.
 * `sharp` re-codifica sin metadatos: EXIF (incluida la ubicación GPS) no llega a las variantes.
 */
export async function processImage(input: Buffer, mediaDir: string): Promise<ProcessedImage> {
  const hash = hashImage(input);
  const source = openImage(input).rotate();
  const { width: originalWidth = 0 } = await source.metadata();
  if (!originalWidth) throw new Error('No se pudo leer el ancho de la imagen');

  const widths = [...new Set(MEDIA_WIDTHS.map((w) => Math.min(w, originalWidth)))];
  await mkdir(mediaDir, { recursive: true });

  const variants: ProcessedVariant[] = [];
  const overBudget: OverBudget[] = [];
  let largest = { width: 0, height: 0 };
  for (const width of widths) {
    const resized = source.clone().resize({ width, withoutEnlargement: true });
    const budget = budgetFor(width);
    const webp = await encodeWithin(budget, WEBP_QUALITIES, (quality) =>
      resized.clone().webp({ quality, effort: 5, smartSubsample: true }),
    );
    // effort 3: mismo peso que 4 en las fotos del seed y unas 6 veces más rápido.
    const avifBudget = Math.min(budget, webp.data.length);
    const avif = await encodeWithin(avifBudget, AVIF_QUALITIES, (quality) =>
      resized.clone().avif({ quality, effort: 3 }),
    );
    if (!webp.fits) overBudget.push({ width, format: 'webp', bytes: webp.data.length, budget });
    if (!avif.fits) {
      overBudget.push({ width, format: 'avif', bytes: avif.data.length, budget: avifBudget });
    }

    const name = `${hash}-v${MEDIA_ENCODING_VERSION}-${width}`;
    await Promise.all([
      writeFile(join(mediaDir, `${name}.avif`), avif.data),
      writeFile(join(mediaDir, `${name}.webp`), webp.data),
    ]);
    variants.push({
      width,
      avif: `${MEDIA_PUBLIC_PREFIX}/${name}.avif`,
      webp: `${MEDIA_PUBLIC_PREFIX}/${name}.webp`,
      avifBytes: avif.data.length,
      webpBytes: webp.data.length,
    });
    if (webp.info.width > largest.width) {
      largest = { width: webp.info.width, height: webp.info.height };
    }
  }

  return {
    hash,
    width: largest.width,
    height: largest.height,
    path: variants.at(-1)!.webp,
    variants,
    encodingVersion: MEDIA_ENCODING_VERSION,
    overBudget,
  };
}

/**
 * Presupuesto de la WebP para un ancho. Si la imagen es más chica que el ancho nominal, se
 * escala por la superficie (el peso crece con la cantidad de píxeles).
 */
export function budgetFor(width: number): number {
  const nominal = MEDIA_WIDTHS.find((w) => w >= width) ?? MEDIA_WIDTHS.at(-1)!;
  return Math.round(MEDIA_BUDGET[nominal] * Math.min(1, (width / nominal) ** 2));
}

/** Codifica bajando de calidad hasta entrar en el presupuesto; si no entra, queda en el piso. */
async function encodeWithin(
  budget: number,
  qualities: readonly number[],
  encoder: (quality: number) => Sharp,
) {
  let result: { data: Buffer; info: sharp.OutputInfo } | undefined;
  for (const quality of qualities) {
    result = await encoder(quality).toBuffer({ resolveWithObject: true });
    if (result.data.length <= budget) return { ...result, quality, fits: true };
  }
  return { ...result!, quality: qualities.at(-1)!, fits: false };
}
