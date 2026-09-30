import type { ReactNode } from 'react';

type NotFoundProps = {
  /** Enlace al inicio. Cada app pasa el <Link> de su router; por defecto es un <a href="/">. */
  homeLink?: ReactNode;
};

export function NotFound({ homeLink }: NotFoundProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 text-center">
      <p className="font-display text-8xl font-black tracking-tighter text-brand-text">404</p>
      <h1 className="font-display text-2xl font-extrabold uppercase">Página no encontrada</h1>
      <p className="text-muted-foreground">La página que buscás no existe o fue movida.</p>
      {homeLink ?? (
        <a href="/" className="font-medium text-brand-text underline underline-offset-4">
          Volver al inicio
        </a>
      )}
    </div>
  );
}
