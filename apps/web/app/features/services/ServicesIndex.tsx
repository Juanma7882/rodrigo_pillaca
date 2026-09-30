import type { ServiceChapter } from '@tamila/shared';
import { cn, ResponsiveImage } from '@tamila/ui';
import { useState } from 'react';
import { twoDigits } from '~/shared/format';
import { SectionHeader, usePrefersReducedMotion } from '~/shared/ui';
import { useRotation } from './useRotation';

/**
 * Índice "Contenido": servicios numerados en dos columnas y una portada que rota sola.
 * Al pasar el mouse o el foco por un servicio se muestra su portada y la rotación se pausa.
 */
export function ServicesIndex({ services }: { services: ServiceChapter[] }) {
  const reducedMotion = usePrefersReducedMotion();
  const [interacting, setInteracting] = useState(false);
  const [active, setActive] = useRotation({
    count: services.length,
    paused: interacting,
    disabled: reducedMotion,
  });
  const current = services[active];

  return (
    <section id="servicios" aria-labelledby="servicios-titulo" className="scroll-mt-16 border-t">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-12 md:py-28">
        <div className="md:col-span-7">
          <SectionHeader folio="Pág. 02 · Índice" title="Contenido" id="servicios-titulo" />
          <ol
            className="mt-10 grid gap-x-10 sm:grid-cols-2"
            onMouseEnter={() => setInteracting(true)}
            onMouseLeave={() => setInteracting(false)}
            onFocus={() => setInteracting(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false);
            }}
          >
            {services.map((service, index) => (
              <li key={service.slug} className="border-b">
                <a
                  href={`#servicio-${service.slug}`}
                  aria-current={index === active ? 'true' : undefined}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className="group flex items-baseline gap-4 py-4"
                >
                  <span
                    className={cn(
                      'font-display text-sm font-black text-brand-text transition-transform motion-reduce:transition-none',
                      index === active && 'translate-x-1',
                    )}
                  >
                    {twoDigits(service.number)}
                  </span>
                  <span
                    className={cn(
                      'font-semibold tracking-wide uppercase transition-colors',
                      index === active
                        ? 'text-foreground'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  >
                    {service.name}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>

        <figure className="md:col-span-5 md:pt-24">
          <div className="relative aspect-[4/5] overflow-hidden bg-muted">
            {services.map((service, index) =>
              // Solo se montan la portada activa y la siguiente (precarga): el resto, cuando les toca.
              service.coverImage &&
              (index === active || index === (active + 1) % services.length) ? (
                <ResponsiveImage
                  key={service.slug}
                  image={service.coverImage}
                  sizes="(min-width: 768px) 40vw, 100vw"
                  grayscale={false}
                  className={cn(
                    'absolute inset-0 transition-opacity duration-[600ms] motion-reduce:transition-none',
                    index === active ? 'opacity-100' : 'opacity-0',
                  )}
                  imgClassName="grayscale"
                />
              ) : null,
            )}
          </div>
          {current && (
            <figcaption className="mt-3 flex items-baseline gap-3 text-sm" aria-live="polite">
              <span className="font-display font-black text-brand-text">
                {twoDigits(current.number)}
              </span>
              <span className="font-semibold uppercase">{current.name}</span>
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}
