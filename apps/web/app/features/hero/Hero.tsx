import type { SiteSettings } from '@tamila/shared';
import { buttonVariants, cn, Eyebrow, ResponsiveImage, Rule } from '@tamila/ui';
import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router';
import { WhatsAppButton } from '~/features/whatsapp';

/**
 * Portada: título centrado a pantalla completa, como la tapa de una revista. Con foto de fondo,
 * la sección usa los tokens del modo oscuro (texto claro) sobre una capa oscura.
 */
export function Hero({ settings }: { settings: SiteSettings }) {
  const image = settings.heroImage;
  return (
    <section
      aria-labelledby="hero-titulo"
      className={cn(
        'relative isolate flex min-h-[calc(100svh-4rem)] flex-col',
        image && 'dark bg-background text-foreground',
      )}
    >
      {image && (
        <>
          <ResponsiveImage
            image={image}
            sizes="100vw"
            priority
            grayscale={false}
            className="absolute inset-0 -z-20"
            imgClassName="grayscale"
          />
          {/* Capa oscura: mantiene el contraste AA del texto sobre cualquier zona de la foto. */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-ink-950/80" />
        </>
      )}
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 border-b border-foreground/20 px-4 py-3 sm:px-6">
        <Eyebrow as="span">TAMILA · Nº 01</Eyebrow>
        <Eyebrow as="span" className="hidden sm:block">
          Construcción y reformas
        </Eyebrow>
        <Eyebrow as="span">Pág. 01</Eyebrow>
      </div>

      <div className="mx-auto flex max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <h1
          id="hero-titulo"
          className="font-display text-[clamp(2rem,10.5vw,8rem)] leading-[0.88] font-black tracking-tighter text-balance uppercase"
        >
          {settings.heroTitle}
        </h1>
        <Rule className="mx-auto w-24 border-primary" />
        <p className="max-w-2xl text-lg text-balance text-foreground/85 sm:text-xl">
          {settings.heroSubtitle}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <WhatsAppButton
            number={settings.whatsappNumber}
            message={settings.whatsappDefaultMessage}
            size="lg"
          >
            Pedir presupuesto sin cargo
          </WhatsAppButton>
          <Link
            to={{ pathname: '/', hash: '#servicios' }}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'rounded-none font-semibold',
            )}
          >
            Ver servicios
          </Link>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl justify-center px-4 pb-6">
        <Eyebrow as="span" className="flex items-center gap-2">
          Seguí leyendo <ArrowDown aria-hidden className="size-3 motion-safe:animate-bounce" />
        </Eyebrow>
      </div>
    </section>
  );
}
