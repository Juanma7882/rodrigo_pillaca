import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderRoutes, signIn } from '@/test/render';
import { routes } from './router';

describe('router', () => {
  beforeEach(() => {
    signIn();
    // Las páginas piden datos: la respuesta queda pendiente para ver solo el render inicial.
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => undefined)),
    );
  });

  it.each([
    ['/configuracion', 'Configuración'],
    ['/servicios', 'Servicios'],
    ['/trabajos', 'Trabajos'],
    ['/imagenes', 'Imágenes'],
    ['/como-trabajamos', 'Cómo trabajamos'],
    ['/preguntas', 'Preguntas frecuentes'],
  ])('%s carga su página de forma diferida', async (path, title) => {
    renderRoutes(routes, path);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
  });

  it('una ruta inexistente muestra la página 404', async () => {
    renderRoutes(routes, '/no-existe');
    expect(
      await screen.findByRole('heading', { name: 'Página no encontrada' }),
    ).toBeInTheDocument();
  });
});
