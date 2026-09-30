import { data } from 'react-router';
import type { Route } from './+types/not-found';

export function loader() {
  throw data(null, { status: 404 });
}

export function meta(_: Route.MetaArgs) {
  return [{ title: 'Página no encontrada · TAMILA' }];
}

export default function NotFoundRoute() {
  return null;
}
