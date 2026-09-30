import { cn } from '../lib/utils';

export function PageLoader({
  label = 'Cargando…',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex min-h-[40vh] items-center justify-center gap-3', className)}
    >
      <span
        aria-hidden
        className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary motion-reduce:animate-none"
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
