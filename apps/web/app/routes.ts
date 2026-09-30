import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('servicios/:slug', 'routes/servicio.tsx'),
  route('sitemap.xml', 'routes/sitemap.ts'),
  route('robots.txt', 'routes/robots.ts'),
  // Cualquier otra URL responde 404 desde el servidor.
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
