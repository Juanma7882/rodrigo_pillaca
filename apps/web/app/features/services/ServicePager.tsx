import type { ServiceLink } from '@tamila/shared';
import { Eyebrow } from '@tamila/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

/** Enlaces al servicio anterior y al siguiente, como el pie de página de una revista. */
export function ServicePager({
  previous,
  next,
}: {
  previous: ServiceLink | null;
  next: ServiceLink | null;
}) {
  if (!previous && !next) return null;
  return (
    <nav aria-label="Otros servicios" className="border-t">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6">
        {previous ? (
          <Link to={`/servicios/${previous.slug}`} className="group flex flex-col gap-2">
            <Eyebrow as="span" className="flex items-center gap-2">
              <ArrowLeft aria-hidden className="size-3" /> Anterior
            </Eyebrow>
            <span className="font-display text-xl font-black uppercase group-hover:text-brand-text sm:text-3xl">
              {previous.name}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to={`/servicios/${next.slug}`}
            className="group flex flex-col items-end gap-2 text-right"
          >
            <Eyebrow as="span" className="flex items-center gap-2">
              Siguiente <ArrowRight aria-hidden className="size-3" />
            </Eyebrow>
            <span className="font-display text-xl font-black uppercase group-hover:text-brand-text sm:text-3xl">
              {next.name}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
