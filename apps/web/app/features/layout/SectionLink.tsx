import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';

type SectionLinkProps = {
  id: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
};

/**
 * Enlace a una sección del inicio (/#id). Desde otra página navega al inicio y React Router
 * hace scroll al ancla; en el inicio mismo hace scroll aunque el hash no cambie.
 */
export function SectionLink({ id, children, className, onNavigate }: SectionLinkProps) {
  const location = useLocation();
  return (
    <Link
      to={{ pathname: '/', hash: `#${id}` }}
      className={className}
      onClick={() => {
        onNavigate?.();
        if (location.pathname === '/') {
          document.getElementById(id)?.scrollIntoView({ block: 'start' });
        }
      }}
    >
      {children}
    </Link>
  );
}
