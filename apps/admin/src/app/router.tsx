import { NotFound, PageLoader, RouteError } from '@tamila/ui';
import { createBrowserRouter, Link, type RouteObject } from 'react-router';

const homeLink = (
  <Link to="/" className="font-medium text-brand-text underline underline-offset-4">
    Volver al inicio
  </Link>
);

// Cada ruta carga su código recién cuando se navega a ella.
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageLoader />,
    children: [
      {
        path: '/login',
        lazy: async () => ({
          Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
        }),
      },
      {
        path: '/',
        lazy: async () => ({ Component: (await import('./layouts/AdminLayout')).AdminLayout }),
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/dashboard')).DashboardPage }),
          },
        ],
      },
      { path: '*', element: <NotFound homeLink={homeLink} /> },
    ],
  },
];

export const createRouter = () => createBrowserRouter(routes);
