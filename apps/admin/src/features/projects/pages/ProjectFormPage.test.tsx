import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { mediaFixture, mediaPage, projectFixture, serviceFixture } from '@/test/fixtures';
import { renderRoutes, signIn } from '@/test/render';
import { ProjectFormPage } from './ProjectFormPage';

const routes = [
  { path: '/trabajos/:id', element: <ProjectFormPage /> },
  { path: '/trabajos', element: <h1>Lista de trabajos</h1> },
];
const services = [
  serviceFixture('durlock', { name: 'Durlock' }),
  serviceFixture('pintura', { name: 'Pintura' }),
];
const bodyOf = (init: RequestInit) => JSON.parse(String(init.body)) as Record<string, unknown>;
const LIBRARY = 'GET /api/admin/media?page=1&pageSize=24';

describe('ProjectFormPage', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('crea un trabajo publicado con las fotos de antes y después elegidas', async () => {
    const user = userEvent.setup();
    const antes = mediaFixture('antes', { alt: 'Antes del living' });
    const despues = mediaFixture('despues', { alt: 'Después del living' });
    const created = projectFixture('nuevo-id', { title: 'Living en Belgrano' });
    const fetch = mockFetch({
      'GET /api/admin/services': [
        { status: 200, body: services },
        { status: 200, body: services },
      ],
      [LIBRARY]: [
        { status: 200, body: mediaPage([antes, despues]) },
        { status: 200, body: mediaPage([antes, despues]) },
      ],
      'POST /api/admin/projects': [{ status: 201, body: created }],
      'GET /api/admin/projects/nuevo-id': [{ status: 200, body: created }],
    });
    renderRoutes(routes, '/trabajos/nuevo');

    await user.type(screen.getByLabelText('Título'), 'Living en Belgrano');
    const service = screen.getByLabelText('Servicio');
    await waitFor(() => expect(service).toBeEnabled());
    await user.selectOptions(service, 'Pintura');
    await user.type(screen.getByLabelText('Año (opcional)'), '2025');
    await user.type(screen.getByLabelText('Descripción'), 'Pintura completa.');
    await user.click(screen.getByRole('switch', { name: 'Publicar el trabajo' }));

    await user.click(screen.getByRole('button', { name: 'Elegir foto de antes' }));
    await user.click(await screen.findByRole('button', { name: 'Elegir Antes del living' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Elegir foto de después' }));
    await user.click(await screen.findByRole('button', { name: 'Elegir Después del living' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Crear trabajo' }));
    expect(await screen.findByRole('heading', { name: 'Living en Belgrano' })).toBeInTheDocument();
    expect(bodyOf(fetch.calls.find((c) => c.key === 'POST /api/admin/projects')!.init)).toEqual({
      title: 'Living en Belgrano',
      year: 2025,
      location: null,
      description: 'Pintura completa.',
      serviceId: 'pintura',
      published: true,
      beforeImageId: 'antes',
      afterImageId: 'despues',
      imageIds: [],
    });
  });

  it('un año fuera de rango muestra el error en su campo y no envía nada', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({ 'GET /api/admin/services': [{ status: 200, body: services }] });
    renderRoutes(routes, '/trabajos/nuevo?servicio=durlock');

    const service = screen.getByLabelText('Servicio');
    await waitFor(() => expect(service).toHaveValue('durlock'));
    await user.type(screen.getByLabelText('Título'), 'Casa');
    await user.type(screen.getByLabelText('Descripción'), 'Texto');
    await user.type(screen.getByLabelText('Año (opcional)'), '1950');
    await user.click(screen.getByRole('button', { name: 'Crear trabajo' }));

    const year = screen.getByLabelText('Año (opcional)');
    await waitFor(() =>
      expect(year).toHaveAccessibleDescription('El año no puede ser anterior a 1990'),
    );
    expect(fetch.calls.every((c) => c.key.startsWith('GET'))).toBe(true);
  });

  it('editar envía solo lo modificado y borrar pide confirmación', async () => {
    const user = userEvent.setup();
    const oficina = projectFixture('p1', { title: 'Oficina', featured: true });
    const fetch = mockFetch({
      'GET /api/admin/services': [{ status: 200, body: services }],
      'GET /api/admin/projects/p1': [{ status: 200, body: oficina }],
      'PATCH /api/admin/projects/p1': [{ status: 200, body: { ...oficina, location: 'Recoleta' } }],
      'DELETE /api/admin/projects/p1': [{ status: 204 }],
    });
    renderRoutes(routes, '/trabajos/p1');
    const location = await screen.findByLabelText('Zona (opcional)');
    await user.clear(location);
    await user.type(location, 'Recoleta');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Cambios guardados');
    expect(bodyOf(fetch.calls.find((c) => c.key.startsWith('PATCH'))!.init)).toEqual({
      location: 'Recoleta',
    });

    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    const dialog = await screen.findByRole('alertdialog', { name: '¿Borrar "Oficina"?' });
    expect(dialog).toHaveTextContent('queda sin destacado');
    await user.click(within(dialog).getByRole('button', { name: 'Borrar trabajo' }));
    expect(await screen.findByRole('heading', { name: 'Lista de trabajos' })).toBeInTheDocument();
  });
});
