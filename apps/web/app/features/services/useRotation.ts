import { useEffect, useState } from 'react';

type Options = { count: number; interval?: number; paused: boolean; disabled: boolean };

/** Índice que avanza solo cada `interval` ms, salvo en pausa, deshabilitado o con la pestaña oculta. */
export function useRotation({ count, interval = 4000, paused, disabled }: Options) {
  const [index, setIndex] = useState(0);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const onVisibility = () => setTabHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (paused || disabled || tabHidden || count < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => window.clearInterval(id);
  }, [count, interval, paused, disabled, tabHidden]);

  return [index, setIndex] as const;
}
