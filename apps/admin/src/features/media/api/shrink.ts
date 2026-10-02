/** Lado mayor máximo antes de subir: el original que guarda la API sigue superando los 1600 px. */
export const MAX_SIDE = 3200;
/** Fotos más pesadas que esto se re-codifican aunque no superen MAX_SIDE (la API acepta 10 MB). */
export const MAX_BYTES = 8 * 1024 * 1024;
const JPEG_QUALITY = 0.9;

/**
 * Achica en el navegador las fotos muy grandes (sin recortar: mantiene la proporción y respeta
 * la orientación de la cámara) para que suban rápido con datos móviles y no superen el límite
 * de la API. Si el navegador no puede decodificar el archivo, lo devuelve tal cual.
 */
export async function shrinkImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= MAX_SIDE && file.size <= MAX_BYTES) return file;

    const scale = Math.min(1, MAX_SIDE / longest);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const blob = await toJpeg(bitmap, width, height);
    const name = `${file.name.replace(/\.[^.]+$/, '') || 'foto'}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

async function toJpeg(bitmap: ImageBitmap, width: number, height: number): Promise<Blob> {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    return canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo achicar la imagen'))),
      'image/jpeg',
      JPEG_QUALITY,
    ),
  );
}
