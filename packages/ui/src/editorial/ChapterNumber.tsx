import { cn } from '../lib/utils';

type ChapterNumberProps = { value: number; className?: string };

/** Número de capítulo gigante con el trazo diagonal amarillo de la marca: "01 ╱". */
export function ChapterNumber({ value, className }: ChapterNumberProps) {
  const label = String(value).padStart(2, '0');
  return (
    <span
      className={cn(
        'font-display inline-flex items-end leading-[0.8] font-black tracking-tighter',
        className,
      )}
    >
      <span>{label}</span>
      <svg
        aria-hidden
        viewBox="0 0 40 100"
        preserveAspectRatio="none"
        className="-ml-[0.04em] h-[0.95em] w-[0.34em] text-primary"
      >
        <line
          x1="38"
          y1="2"
          x2="2"
          y2="98"
          stroke="currentColor"
          strokeWidth="5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  );
}
