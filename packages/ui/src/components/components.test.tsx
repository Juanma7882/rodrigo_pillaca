import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotFound } from './NotFound';
import { PageLoader } from './PageLoader';
import { RouteError } from './RouteError';

describe('componentes base', () => {
  it('PageLoader anuncia la carga', () => {
    render(<PageLoader />);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
  });

  it('RouteError muestra el mensaje y reintenta', async () => {
    const onRetry = vi.fn();
    render(<RouteError onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos cargar esta sección');
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('NotFound ofrece volver al inicio', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });
});
