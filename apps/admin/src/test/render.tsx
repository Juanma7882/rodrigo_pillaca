import { ThemeProvider, Toaster } from '@tamila/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { useSessionStore } from '@/features/auth';

/** Sesión iniciada con un access token de prueba. */
export function signIn(token = 'A') {
  useSessionStore.setState({
    status: 'authenticated',
    accessToken: token,
    admin: { id: '1', email: 'admin@tamila.test', createdAt: '2026-09-30T12:00:00.000Z' },
  });
}

/**
 * Renderiza rutas con los mismos providers que la app (tema, React Query, toasts) sobre un
 * router en memoria. Cada llamada usa un QueryClient nuevo y sin reintentos.
 */
export function renderRoutes(routes: RouteObject[], path = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { ...result, router, queryClient };
}

/** Renderiza un único elemento en `path` (con `pattern` para rutas con parámetros). */
export function renderPage(element: React.ReactNode, path = '/', pattern = path.split('?')[0]) {
  return renderRoutes(
    [
      { path: pattern, element },
      { path: '*', element: <p>Otra pantalla</p> },
    ],
    path,
  );
}
