import { cn } from '../lib/utils';

type RuleProps = { variant?: 'short' | 'full'; className?: string };

/** Línea separadora: corta y gruesa bajo los títulos, o fina a lo ancho entre bloques. */
export function Rule({ variant = 'short', className }: RuleProps) {
  return (
    <hr
      className={cn(
        variant === 'short'
          ? 'w-16 border-t-[3px] border-foreground'
          : 'w-full border-t border-border',
        className,
      )}
    />
  );
}
