import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Pide confirmación antes de salir con cambios sin guardar: dentro del panel (useBlocker) y al
 * recargar o cerrar la pestaña (beforeunload). Cambiar solo la query (filtros) no cuenta.
 * Devuelve el diálogo a renderizar y `allowNavigation`, para navegar justo después de guardar
 * (el formulario todavía se ve modificado hasta el próximo render).
 */
export function useUnsavedChanges(isDirty: boolean) {
  const bypass = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !bypass.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!isDirty) {
      bypass.current = false;
      return;
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const dialog = (
    <ConfirmDialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset();
      }}
      title="¿Descartar los cambios?"
      description="Tenés cambios sin guardar en esta pantalla. Si salís ahora, se pierden."
      confirmLabel="Descartar y salir"
      cancelLabel="Seguir editando"
      destructive
      onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
    />
  );

  return {
    dialog,
    allowNavigation: () => {
      bypass.current = true;
    },
  };
}
