import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderRoutes, signIn } from '@/test/render';
import { navItems } from '../nav-items';
import { AdminLayout } from './AdminLayout';

const renderAt = (path: string) =>
  renderRoutes(
    [
      {
        path: '/',
        element: <AdminLayout />,
        children: navItems.map((item) =>
          item.to === '/'
            ? { index: true, element: <h1>Página Inicio</h1> }
            : { path: item.to.slice(1), element: <h1>Página {item.label}</h1> },
        ),
      },
    ],
    path,
  );

describe('AdminLayout', () => {
  beforeEach(() => signIn());

  it('en la compu, el menú lateral tiene todas las secciones', () => {
    renderAt('/');
    const menu = screen.getByRole('navigation', { name: 'Menú principal' });
    expect(
      within(menu)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(navItems.map((item) => item.label));
  });

  it('en el celular, la barra inferior tiene las principales y "Más"', () => {
    renderAt('/');
    const bar = screen.getByRole('navigation', { name: 'Secciones' });
    expect(
      within(bar)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Inicio', 'Servicios', 'Trabajos', 'Imágenes']);
    expect(within(bar).getByRole('button', { name: 'Más' })).toBeInTheDocument();
  });

  it('marca la sección actual en las dos navegaciones', () => {
    renderAt('/trabajos');
    for (const name of ['Menú principal', 'Secciones']) {
      const nav = screen.getByRole('navigation', { name });
      expect(within(nav).getByRole('link', { name: 'Trabajos' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(within(nav).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
    }
  });

  it('"Más" abre las secciones secundarias y se cierra al elegir una', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const bar = screen.getByRole('navigation', { name: 'Secciones' });
    await user.click(within(bar).getByRole('button', { name: 'Más' }));

    const sheet = await screen.findByRole('dialog', { name: 'Más secciones' });
    const more = within(sheet).getByRole('navigation', { name: 'Más secciones' });
    expect(
      within(more)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(['Configuración', 'Cómo trabajamos', 'Preguntas frecuentes']);

    await user.click(within(more).getByRole('link', { name: 'Preguntas frecuentes' }));
    expect(
      await screen.findByRole('heading', { name: 'Página Preguntas frecuentes' }),
    ).toBeVisible();
    expect(screen.queryByRole('dialog', { name: 'Más secciones' })).not.toBeInTheDocument();
  });
});
