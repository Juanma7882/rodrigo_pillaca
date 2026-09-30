import { useEffect, useState } from 'react';

const THRESHOLD = 8;

/** Oculta la barra al bajar y la muestra al subir (siempre visible cerca del inicio). */
export function useHideOnScroll(disabled: boolean): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (disabled) return;
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 80) setHidden(false);
        else if (y > lastY + THRESHOLD) setHidden(true);
        else if (y < lastY - THRESHOLD) setHidden(false);
        if (Math.abs(y - lastY) > THRESHOLD) lastY = y;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [disabled]);

  return hidden && !disabled;
}
