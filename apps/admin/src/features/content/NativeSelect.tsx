import { cn } from '@tamila/ui';
import type { ComponentProps } from 'react';

/** Select nativo con el estilo de los inputs: en el celular abre el selector del sistema. */
export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-11 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive md:h-9 md:text-sm dark:bg-input/30',
        className,
      )}
      {...props}
    />
  );
}
