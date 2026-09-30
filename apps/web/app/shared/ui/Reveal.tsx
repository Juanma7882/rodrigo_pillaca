import { useEffect, useRef, useState, type ReactNode } from 'react';

type RevealProps = { children: ReactNode; className?: string; as?: 'div' | 'li' | 'section' };

/**
 * Aparición suave al entrar en pantalla. Solo se oculta con JS activo (clase `js` en <html>) y
 * no anima con movimiento reducido (ver app.css).
 */
export function Reveal({ children, className, as: Tag = 'div' }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(
    () => typeof window !== 'undefined' && !('IntersectionObserver' in window),
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Tag ref={ref as never} data-reveal={visible ? 'visible' : 'hidden'} className={className}>
      {children}
    </Tag>
  );
}
