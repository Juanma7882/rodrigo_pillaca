import { cn, Eyebrow, Rule } from '@tamila/ui';
import type { ReactNode } from 'react';

type SectionHeaderProps = {
  folio: string;
  title: ReactNode;
  id?: string;
  intro?: ReactNode;
  /** `md` para columnas angostas. */
  size?: 'lg' | 'md';
};

/** Encabezado de sección estilo revista: folio, título grande y línea. */
export function SectionHeader({ folio, title, id, intro, size = 'lg' }: SectionHeaderProps) {
  return (
    <header className="flex flex-col gap-5">
      <Eyebrow>{folio}</Eyebrow>
      <h2
        id={id}
        className={cn(
          'font-display leading-[0.9] font-black tracking-tighter text-balance uppercase',
          size === 'lg' ? 'text-[clamp(2.5rem,7vw,5.5rem)]' : 'text-[clamp(2.25rem,4.5vw,3.75rem)]',
        )}
      >
        {title}
      </h2>
      <Rule />
      {intro && <p className="max-w-2xl text-lg text-muted-foreground">{intro}</p>}
    </header>
  );
}
