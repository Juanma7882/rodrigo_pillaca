import type { ServiceChapter as ServiceChapterData } from '@tamila/shared';
import {
  buttonVariants,
  ChapterNumber,
  cn,
  Eyebrow,
  PullQuote,
  ResponsiveImage,
  Rule,
} from '@tamila/ui';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { serviceMessage, WhatsAppButton } from '~/features/whatsapp';
import { twoDigits } from '~/shared/format';
import { Reveal } from '~/shared/ui';

type ServiceChapterProps = {
  service: ServiceChapterData;
  whatsappNumber: string;
  /** En la página propia del servicio el título es h1 y no se enlaza a sí mismo. */
  standalone?: boolean;
};

/**
 * "Página de capítulo" de revista en doble página: número gigante con trazo, título, bajada,
 * cita, grilla asimétrica de fotos, trabajo destacado y "Qué incluye". Los pares se espejan.
 */
export function ServiceChapter({
  service,
  whatsappNumber,
  standalone = false,
}: ServiceChapterProps) {
  const mirrored = service.number % 2 === 0;
  const [main, secondary, vertical] = [
    service.images[0] ?? service.coverImage,
    service.images[1] ?? service.images[0] ?? service.coverImage,
    service.images[2],
  ];
  const Title = standalone ? 'h1' : 'h2';
  // Como en una revista: la página izquierda lleva folio par y la derecha, impar.
  const evenFolio = service.number * 2 + 2;
  const titleFolio = mirrored ? evenFolio + 1 : evenFolio;
  const photoFolio = mirrored ? evenFolio : evenFolio + 1;
  const project = service.featuredProject;

  return (
    <article
      id={`servicio-${service.slug}`}
      aria-labelledby={`titulo-${service.slug}`}
      className="scroll-mt-16 border-t"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2 lg:gap-0">
        {/* Página izquierda (derecha en los capítulos pares) */}
        <Reveal
          className={cn(
            'flex flex-col gap-8 lg:pr-12',
            mirrored && 'lg:order-2 lg:border-l lg:pr-0 lg:pl-12',
            !mirrored && 'lg:border-r',
          )}
        >
          <Eyebrow>Pág. {twoDigits(titleFolio)} · Servicios</Eyebrow>
          <Title
            id={`titulo-${service.slug}`}
            className="font-display text-[clamp(2.25rem,9vw,4.25rem)] leading-[0.88] font-black tracking-tighter break-words hyphens-auto uppercase lg:text-[clamp(2.75rem,4.6vw,4.75rem)]"
          >
            {service.name}
          </Title>
          <Rule />
          <div className="flex items-end justify-between gap-6">
            <ChapterNumber value={service.number} className="text-[clamp(6rem,15vw,11rem)]" />
            <p className="max-w-[13rem] text-right text-sm leading-snug font-extrabold tracking-wide uppercase">
              {service.tagline}
            </p>
          </div>
          <PullQuote>{service.summary}</PullQuote>
          {secondary && (
            <ResponsiveImage
              image={secondary}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="group aspect-[4/3]"
            />
          )}
        </Reveal>

        {/* Página derecha */}
        <Reveal className={cn('flex flex-col gap-8', mirrored ? 'lg:pr-12' : 'lg:pl-12')}>
          <Eyebrow className={cn(!mirrored && 'lg:text-right')}>
            Pág. {twoDigits(photoFolio)} · {service.name}
          </Eyebrow>
          {main && (
            <ResponsiveImage
              image={main}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="group aspect-[16/10]"
            />
          )}
          <div className="grid gap-6 sm:grid-cols-5">
            {vertical && (
              <ResponsiveImage
                image={vertical}
                sizes="(min-width: 1024px) 18vw, 100vw"
                className="group aspect-[3/4] sm:col-span-2"
              />
            )}
            <div
              className={cn('flex flex-col gap-4', vertical ? 'sm:col-span-3' : 'sm:col-span-5')}
            >
              {project && (
                <div className="flex flex-col gap-2 border-b pb-4">
                  <Eyebrow>
                    {[project.year, project.location].filter(Boolean).join(' · ') ||
                      'Trabajo destacado'}
                  </Eyebrow>
                  <h3 className="text-lg leading-tight font-extrabold uppercase">
                    Proyecto: {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
              )}
              <p className="leading-relaxed">{service.description}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
              Qué incluye
            </h3>
            <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {service.includes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <WhatsAppButton number={whatsappNumber} message={serviceMessage(service.name)}>
              Consultar por {service.name}
            </WhatsAppButton>
            {!standalone && (
              <Link
                to={`/servicios/${service.slug}`}
                className={cn(buttonVariants({ variant: 'ghost' }), 'rounded-none font-semibold')}
              >
                Ver servicio completo <ArrowRight aria-hidden />
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </article>
  );
}
