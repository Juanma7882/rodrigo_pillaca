import { Button } from './ui/button';

type RouteErrorProps = {
  title?: string;
  message?: string;
  /** Por defecto recarga la página: recupera chunks que fallaron al descargarse. */
  onRetry?: () => void;
};

export function RouteError({
  title = 'No pudimos cargar esta sección',
  message = 'Revisá tu conexión e intentá de nuevo.',
  onRetry = () => window.location.reload(),
}: RouteErrorProps) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center gap-4 text-center"
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{message}</p>
      <Button type="button" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
