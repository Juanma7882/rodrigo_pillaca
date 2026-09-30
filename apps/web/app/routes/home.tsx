import { HomePage } from '~/features/home';
import type { Route } from './+types/home';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'TAMILA · Construcción y reformas' },
    {
      name: 'description',
      content: 'Servicios de construcción en seco, pintura, pisos e instalaciones.',
    },
  ];
}

export default function Home() {
  return <HomePage />;
}
