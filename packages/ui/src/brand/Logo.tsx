import { cn } from '../lib/utils';

/**
 * Isotipo de TAMILA: barras amarillas ascendentes cruzadas por una diagonal.
 * PROVISORIO: recreación aproximada del logo; reemplazar por el SVG original de la marca.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" aria-hidden className={cn('text-primary', className)}>
      <g fill="currentColor">
        <rect x="2" y="24" width="7" height="14" />
        <rect x="11" y="14" width="7" height="24" />
        <rect x="20" y="6" width="7" height="32" />
        <rect x="29" y="12" width="7" height="26" />
        <rect x="38" y="2" width="7" height="36" />
      </g>
      <path d="M1 36 L46 9" stroke="var(--background)" strokeWidth="3.5" fill="none" />
    </svg>
  );
}

type LogoProps = { className?: string; markClassName?: string };

/** Logo completo: isotipo + "TAMILA" espaciado. */
export function Logo({ className, markClassName }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('h-7 w-auto', markClassName)} />
      <span className="font-display text-lg font-extrabold tracking-[0.3em]">TAMILA</span>
    </span>
  );
}
