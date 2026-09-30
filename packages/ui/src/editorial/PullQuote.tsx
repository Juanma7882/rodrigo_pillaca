import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type PullQuoteProps = { children: ReactNode; cite?: ReactNode; className?: string };

/** Cita destacada con comillas grandes en amarillo. */
export function PullQuote({ children, cite, className }: PullQuoteProps) {
  return (
    <figure className={cn('flex flex-col gap-3', className)}>
      <span aria-hidden className="font-display text-6xl leading-[0.6] font-black text-primary">
        “
      </span>
      <blockquote className="text-lg leading-relaxed text-foreground">{children}</blockquote>
      {cite && <figcaption className="text-sm font-semibold">{cite}</figcaption>}
    </figure>
  );
}
