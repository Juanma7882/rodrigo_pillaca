import { PageLoader } from '@tamila/ui';
import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { refreshSession } from '../api/client';
import { useSessionStore } from '../store';

/** Protege las rutas internas: recupera la sesión con el refresh token o redirige al login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const status = useSessionStore((state) => state.status);
  const location = useLocation();

  useEffect(() => {
    if (status === 'unknown') refreshSession().catch(() => undefined);
  }, [status]);

  if (status === 'unknown') return <PageLoader label="Verificando sesión…" />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
