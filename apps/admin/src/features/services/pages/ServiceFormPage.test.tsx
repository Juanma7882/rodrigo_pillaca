import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { projectFixture, serviceFixture } from '@/test/fixtures';
import { renderRoutes, signIn } from '@/test/render';
import { ServiceFormPage } from './ServiceFormPage';

const routes = [
  { path: '/servicios/:id', element: <ServiceFormPage /> },
  { path: '/servicios', element: <h1>Lista de servicios</h1> },
];
const bodyOf = (init: RequestInit) => JSON.parse(String(init.body)) as Record<string, unknown>;
const durlock = serviceFixture('durlock', { name: 'Durlock', projectCount: 1 });
const DETAIL = 'GET /api/admin/services/durlock';
const PROJECTS = 'GET /api/admin/projects?serviceId=durlock';

describe('ServiceFormPage', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('al crear sugiere el slug desde el nombre y crea el servicio sin publicar', async () => {
    const user = userEvent.setup();
    const created = serviceFixture('nuevo-id', {
      name: 'Instalación de aire',
      slug: 'instalacion-de-aire',
      published: false,
    });
    const fetch = mockFetch({
      'POST /api/admin/services': [{ status: 201, body: created }],
      'GET /api/admin/services/nuevo-id': [{ status: 200, body: created }],
      'GET /api/admin/projects?serviceId=nuevo-id': [{ status: 200, body: [] }],
    });
    renderRoutes(routes, '/servicios/nuevo');

    await user.type(screen.getByLabelText('Nombre'), 'Instalación de aire');
    expect(screen.getByLabelText('Slug (dirección de la página)')).toHaveValue(
      'instalacion-de-aire',
    );
    await user.type(screen.getByLabelText('Bajada'), 'Frío y calor');
    await user.type(screen.getByLabelText('Resumen'), 'Instalación de equipos split.');
    await user.type(screen.getByLabelText('Descripción'), 'Texto largo.');
    await user.click(screen.getByRole('button', { name: 'Agregar ítem' }));
    await user.type(await screen.findByLabelText('Ítem 1'), 'Split');
    await user.click(screen.getByRole('button', { name: 'Crear servicio' }));

    expect(await screen.findByRole('heading', { name: 'Instalación de aire' })).toBeInTheDocument();
    const post = fetch.calls.find((c) => c.key === 'POST /api/admin/services')!;
    expect(bodyOf(post.init)).toEqual({
      name: 'Instalación de aire',
      slug: 'instalacion-de-aire',
      tagline: 'Frío y calor',
      summary: 'Instalación de equipos split.',
      description: 'Texto largo.',
      includes: ['Split'],
      seoTitle: null,
      seoDescription: null,
      published: false,
      featuredProjectId: null,
      coverImageId: null,
      imageIds: [],
    });
  });

  it('un slug repetido muestra el mensaje en su campo y conserva lo cargado', async () => {
    const user = userEvent.setup();
    mockFetch({
      'POST /api/admin/services': [
        { status: 409, body: { message: 'El slug "durlock" ya está en uso por otro servicio' } },
      ],
    });
    renderRoutes(routes, '/servicios/nuevo');
    await user.type(screen.getByLabelText('Nombre'), 'Durlock');
    await user.type(screen.getByLabelText('Bajada'), 'B');
    await user.type(screen.getByLabelText('Resumen'), 'R');
    await user.type(screen.getByLabelText('Descripción'), 'D');
    await user.click(screen.getByRole('button', { name: 'Crear servicio' }));

    const slug = screen.getByLabelText('Slug (dirección de la página)');
    await waitFor(() => expect(slug).toHaveAccessibleDescription(/ya está en uso/));
    expect(screen.getByLabelText('Descripción')).toHaveValue('D');
  });

  it('al cambiar el slug de un servicio publicado advierte antes de guardar', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      [DETAIL]: [{ status: 200, body: durlock }],
      [PROJECTS]: [{ status: 200, body: [] }],
      'PATCH /api/admin/services/durlock': [
        { status: 200, body: { ...durlock, slug: 'durlock-y-yeso' } },
      ],
    });
    renderRoutes(routes, '/servicios/durlock');
    const slug = await screen.findByLabelText('Slug (dirección de la página)');
    await user.clear(slug);
    await user.type(slug, 'durlock-y-yeso');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    const dialog = await screen.findByRole('alertdialog', {
      name: '¿Cambiar la dirección de la página?',
    });
    expect(dialog).toHaveTextContent('/servicios/durlock deja de funcionar');
    expect(fetch.calls.some((c) => c.key.startsWith('PATCH'))).toBe(false);
    await user.click(within(dialog).getByRole('button', { name: 'Cambiar y guardar' }));

    await screen.findByText('Cambios guardados');
    const patch = fetch.calls.find((c) => c.key === 'PATCH /api/admin/services/durlock')!;
    expect(bodyOf(patch.init)).toEqual({ slug: 'durlock-y-yeso' });
  });

  it('el destacado se elige entre los trabajos del servicio', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      [DETAIL]: [{ status: 200, body: durlock }],
      [PROJECTS]: [{ status: 200, body: [projectFixture('p1', { title: 'Oficina en Palermo' })] }],
      'PATCH /api/admin/services/durlock': [
        { status: 200, body: { ...durlock, featuredProjectId: 'p1' } },
      ],
    });
    renderRoutes(routes, '/servicios/durlock');
    const select = await screen.findByLabelText('Trabajo destacado');
    await waitFor(() => expect(select).toBeEnabled());
    await user.selectOptions(select, 'Oficina en Palermo');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await screen.findByText('Cambios guardados');
    expect(bodyOf(fetch.calls.find((c) => c.key.startsWith('PATCH'))!.init)).toEqual({
      featuredProjectId: 'p1',
    });
  });

  it('si no se puede borrar por tener trabajos, ofrece despublicarlo', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      [DETAIL]: [{ status: 200, body: durlock }],
      [PROJECTS]: [{ status: 200, body: [] }],
      'DELETE /api/admin/services/durlock': [
        {
          status: 409,
          body: {
            message:
              'El servicio tiene 1 trabajo: movelos a otro servicio o borralos antes, o despublicá el servicio',
          },
        },
      ],
      'PATCH /api/admin/services/durlock': [
        { status: 200, body: { ...durlock, published: false } },
      ],
    });
    renderRoutes(routes, '/servicios/durlock');
    await user.click(await screen.findByRole('button', { name: 'Borrar' }));
    await user.click(await screen.findByRole('button', { name: 'Borrar servicio' }));

    const blocked = await screen.findByRole('alertdialog', { name: 'No se puede borrar' });
    expect(blocked).toHaveTextContent('El servicio tiene 1 trabajo');
    await user.click(within(blocked).getByRole('button', { name: 'Despublicar en su lugar' }));

    await screen.findByText('"Durlock" quedó oculto');
    expect(bodyOf(fetch.calls.find((c) => c.key.startsWith('PATCH'))!.init)).toEqual({
      published: false,
    });
    expect(screen.getByRole('switch', { name: 'Publicar Durlock' })).not.toBeChecked();
  });
});
