import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type EyebrowProps = { children: ReactNode; className?: string; as?: 'p' | 'span' | 'div' };

/** Rótulo chico en mayúsculas con tracking amplio, como el folio de una revista. */
export function Eyebrow({ children, className, as: Tag = 'p' }: EyebrowProps) {
  return (
    <Tag
      className={cn(
        'text-[11px] font-semibold tracking-[0.25em] text-muted-foreground uppercase',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
