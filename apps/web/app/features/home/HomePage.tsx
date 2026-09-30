import { lazy, Suspense, useState } from 'react';
import { Button, PageLoader, ThemeToggle } from '@tamila/ui';

// Ejemplo de componente pesado cargado bajo demanda (se reemplaza en el change del sitio).
const Showcase = lazy(() => import('~/features/showcase').then((m) => ({ default: m.Showcase })));

export function HomePage() {
  const [showShowcase, setShowShowcase] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <p className="text-xs font-semibold tracking-[0.3em] text-brand-text uppercase">
        Nº 01 · Construcción y reformas
      </p>
      <h1 className="text-5xl font-black tracking-tight uppercase sm:text-7xl">TAMILA</h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Sitio en construcción. Muy pronto vas a encontrar acá todos nuestros servicios.
      </p>
      {showShowcase ? (
        <Suspense fallback={<PageLoader label="Cargando galería…" />}>
          <Showcase />
        </Suspense>
      ) : (
        <Button type="button" onClick={() => setShowShowcase(true)}>
          Ver galería
        </Button>
      )}
    </main>
  );
}
