import { data } from 'react-router';

export function loader() {
  throw data(null, { status: 404 });
}

export function meta() {
  return [{ title: 'Página no encontrada · TAMILA' }, { name: 'robots', content: 'noindex' }];
}

export default function NotFoundRoute() {
  return null;
}

export { RouteErrorBoundary as ErrorBoundary } from '~/shared/ui';
