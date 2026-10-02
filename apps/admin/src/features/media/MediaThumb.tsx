import { cn, ResponsiveImage } from '@tamila/ui';
import type { MediaAsset } from '@tamila/shared';

/** Miniatura de una imagen (variante más chica, AVIF/WebP, en color). */
export function MediaThumb({
  image,
  className,
  sizes = '(min-width: 768px) 200px, 45vw',
}: {
  image: MediaAsset;
  className?: string;
  sizes?: string;
}) {
  return (
    <ResponsiveImage
      image={image}
      sizes={sizes}
      grayscale={false}
      className={cn('aspect-[4/3] rounded-md', className)}
    />
  );
}
