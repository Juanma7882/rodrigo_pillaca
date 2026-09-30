import { cn } from '../lib/utils';

export type ResponsiveImageSource = {
  alt: string;
  width: number;
  height: number;
  src: string;
  variants: Array<{ width: number; avif: string; webp: string }>;
};

type ResponsiveImageProps = {
  image: ResponsiveImageSource;
  /** Ancho que ocupa la imagen según la pantalla (atributo `sizes`). */
  sizes: string;
  /** Solo para la imagen visible en la carga inicial: se descarga de inmediato y con prioridad. */
  priority?: boolean;
  /** Escala de grises que recupera el color al pasar el mouse (también con `group-hover`). */
  grayscale?: boolean;
  className?: string;
  imgClassName?: string;
};

const srcSet = (variants: ResponsiveImageSource['variants'], format: 'avif' | 'webp') =>
  variants.map((v) => `${v[format]} ${v.width}w`).join(', ');

export function ResponsiveImage({
  image,
  sizes,
  priority = false,
  grayscale = true,
  className,
  imgClassName,
}: ResponsiveImageProps) {
  return (
    <picture className={cn('block overflow-hidden bg-muted', className)}>
      <source type="image/avif" srcSet={srcSet(image.variants, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(image.variants, 'webp')} sizes={sizes} />
      <img
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        className={cn(
          'h-full w-full object-cover',
          grayscale &&
            'grayscale transition-[filter] duration-500 group-hover:grayscale-0 hover:grayscale-0 motion-reduce:transition-none',
          imgClassName,
        )}
      />
    </picture>
  );
}
