import { useEffect, useRef, useState } from 'react';

/** true cuando el elemento está cerca de entrar en pantalla (y queda en true). */
export function useInView<T extends Element>(rootMargin = '200px') {
  const ref = useRef<T>(null);
  // Sin IntersectionObserver (navegadores muy viejos) se considera visible desde el inicio.
  const [inView, setInView] = useState(
    () => typeof window !== 'undefined' && !('IntersectionObserver' in window),
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, rootMargin]);

  return { ref, inView };
}
