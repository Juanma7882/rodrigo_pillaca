import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  // Cualquier otra URL responde 404 desde el servidor.
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
