import { NotFound, RouteError } from '@tamila/ui';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

/** Error de una ruta dentro del layout: 404 con enlace al inicio, o error con reintento. */
export function RouteErrorBoundary() {
  const error = useRouteError();
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="pt-16">
        <NotFound
          homeLink={
            <Link to="/" className="font-medium text-brand-text underline underline-offset-4">
              Volver al inicio
            </Link>
          }
        />
      </div>
    );
  }
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="pt-16">
      <RouteError />
    </div>
  );
}
