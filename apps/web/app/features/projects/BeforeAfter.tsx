import type { MediaAsset } from '@tamila/shared';
import { ResponsiveImage } from '@tamila/ui';
import { useId, useState } from 'react';

type BeforeAfterProps = { before: MediaAsset; after: MediaAsset; title: string };

/**
 * Comparador antes/después. Usa un <input type="range"> nativo sobre la imagen, así funciona
 * con mouse, táctil y teclado (flechas, Inicio/Fin) y los lectores de pantalla lo anuncian.
 */
export function BeforeAfter({ before, after, title }: BeforeAfterProps) {
  const [position, setPosition] = useState(50);
  const id = useId();

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-muted select-none">
      <ResponsiveImage
        image={after}
        sizes="(min-width: 768px) 45vw, 100vw"
        grayscale={false}
        className="absolute inset-0"
      />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <ResponsiveImage
          image={before}
          sizes="(min-width: 768px) 45vw, 100vw"
          grayscale={false}
          className="h-full"
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-primary"
        style={{ left: `${position}%` }}
      >
        <span className="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-xs font-black text-primary-foreground">
          ⟷
        </span>
      </div>
      <span className="pointer-events-none absolute top-3 left-3 bg-background/90 px-2 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase">
        Antes
      </span>
      <span className="pointer-events-none absolute top-3 right-3 bg-background/90 px-2 py-1 text-[11px] font-semibold tracking-[0.2em] uppercase">
        Después
      </span>
      <label htmlFor={id} className="sr-only">
        Comparar antes y después: {title}
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={5}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-valuetext={`${position}% antes, ${100 - position}% después`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0 focus-visible:opacity-0"
      />
    </div>
  );
}
