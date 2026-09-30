import { render } from '@testing-library/react';
import { ThemeProvider } from '@tamila/ui';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

/** Renderiza dentro de un router en memoria y con el tema. */
export function renderWithRouter(ui: ReactElement, path = '/') {
  const router = createMemoryRouter(
    [
      { path: '/', element: ui },
      { path: '*', element: ui },
    ],
    { initialEntries: [path] },
  );
  return {
    ...render(
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>,
    ),
    router,
  };
}
