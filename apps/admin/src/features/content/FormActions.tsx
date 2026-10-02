import { Button, cn } from '@tamila/ui';
import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

type FormActionsProps = {
  isSubmitting: boolean;
  submitLabel?: string;
  /** Acciones secundarias (cancelar, borrar…), a la izquierda del botón de guardar. */
  children?: ReactNode;
  className?: string;
};

/**
 * Acciones de un formulario. En el celular quedan fijas al pie, sobre la barra de navegación,
 * para tener "Guardar" siempre a mano; en la compu van al final del formulario.
 */
export function FormActions({
  isSubmitting,
  submitLabel = 'Guardar',
  children,
  className,
}: FormActionsProps) {
  return (
    <>
      {/* Reserva el espacio de la barra fija para que no tape el último campo. */}
      <div aria-hidden className="h-16 md:hidden" />
      <div
        className={cn(
          'fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex items-center justify-end gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur',
          'md:static md:mt-8 md:border-t md:bg-transparent md:px-0 md:pb-0 md:backdrop-blur-none',
          className,
        )}
      >
        {children}
        <Button type="submit" disabled={isSubmitting} className="min-h-11 md:min-h-9">
          {isSubmitting && <Loader2 aria-hidden className="animate-spin" />}
          {isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </>
  );
}
