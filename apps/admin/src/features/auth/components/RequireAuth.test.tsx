import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, session } from '@/test/fetch-mock';
import { useSessionStore } from '../store';
import { RequireAuth } from './RequireAuth';

const renderAt = (path: string) =>
  render(
    <RouterProvider
      router={createMemoryRouter(
        [
          { path: '/login', element: <p>Pantalla de login</p> },
          {
            path: '/*',
            element: (
              <RequireAuth>
                <p>Contenido protegido</p>
              </RequireAuth>
            ),
          },
        ],
        { initialEntries: [path] },
      )}
    />,
  );

describe('RequireAuth', () => {
  beforeEach(() => useSessionStore.setState({ status: 'unknown', accessToken: null, admin: null }));
  afterEach(() => vi.unstubAllGlobals());

  it('sin sesión redirige al login', async () => {
    mockFetch({ 'POST /api/auth/refresh': [{ status: 401, body: {} }] });
    renderAt('/interna');
    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
  });

  it('recupera la sesión con el refresh token y muestra el contenido', async () => {
    mockFetch({ 'POST /api/auth/refresh': [{ status: 200, body: session('A') }] });
    renderAt('/interna');
    expect(screen.getByRole('status')).toHaveTextContent('Verificando sesión…');
    expect(await screen.findByText('Contenido protegido')).toBeInTheDocument();
  });
});
