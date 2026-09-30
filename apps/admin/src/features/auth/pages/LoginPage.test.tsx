import type * as UiModule from '@tamila/ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@tamila/ui';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, session } from '@/test/fetch-mock';
import { useSessionStore } from '../store';
import { LoginPage } from './LoginPage';

// El widget real de Cloudflare no corre en jsdom: se simula con un botón que entrega el token.
vi.mock('@tamila/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof UiModule>()),
  Turnstile: ({ onToken }: { onToken: (token: string) => void }) => (
    <button type="button" onClick={() => onToken('turnstile-ok')}>
      Resolver desafío
    </button>
  ),
}));

const renderLogin = () =>
  render(
    <ThemeProvider>
      <RouterProvider
        router={createMemoryRouter(
          [
            { path: '/login', element: <LoginPage /> },
            { path: '/', element: <p>Panel interno</p> },
          ],
          { initialEntries: ['/login'] },
        )}
      />
    </ThemeProvider>,
  );

describe('LoginPage', () => {
  beforeEach(() =>
    useSessionStore.setState({ status: 'anonymous', accessToken: null, admin: null }),
  );
  afterEach(() => vi.unstubAllGlobals());

  it('no permite enviar hasta resolver Turnstile', async () => {
    renderLogin();
    expect(screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Ingresar' });
    expect(submit).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Resolver desafío' }));
    expect(submit).toBeEnabled();
  });

  it('muestra los errores de validación en español', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: 'Resolver desafío' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('El email es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
  });

  it('muestra el error de credenciales de la API', async () => {
    mockFetch({
      'POST /api/auth/login': [
        { status: 401, body: { message: 'Email o contraseña incorrectos' } },
      ],
    });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@tamila.test');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await userEvent.click(screen.getByRole('button', { name: 'Resolver desafío' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos');
    // El token de Turnstile ya se usó: hay que resolver el desafío otra vez.
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeDisabled();
  });

  it('con credenciales válidas entra al panel', async () => {
    mockFetch({ 'POST /api/auth/login': [{ status: 200, body: session('A') }] });
    renderLogin();
    await userEvent.type(screen.getByLabelText('Email'), 'admin@tamila.test');
    await userEvent.type(screen.getByLabelText('Contraseña'), 'correcta');
    await userEvent.click(screen.getByRole('button', { name: 'Resolver desafío' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
    expect(await screen.findByText('Panel interno')).toBeInTheDocument();
  });
});
