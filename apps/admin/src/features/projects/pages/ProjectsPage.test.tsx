import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { projectFixture, serviceFixture } from '@/test/fixtures';
import { renderRoutes, signIn } from '@/test/render';
import { ProjectsPage } from './ProjectsPage';

const services = [
  serviceFixture('durlock', { name: 'Durlock' }),
  serviceFixture('pintura', { name: 'Pintura' }),
];
const oficina = projectFixture('p1', { title: 'Oficina en Palermo', featured: true });
const casa = projectFixture('p2', {
  title: 'Casa en Lomas',
  serviceId: 'pintura',
  service: { slug: 'pintura', name: 'Pintura' },
  published: false,
});

const titles = () =>
  within(screen.getByRole('list', { name: 'Trabajos' }))
    .getAllByRole('link')
    .map((l) => l.textContent);

describe('ProjectsPage', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('lista los trabajos con su servicio, año y si es destacado', async () => {
    mockFetch({
      'GET /api/admin/services': [{ status: 200, body: services }],
      'GET /api/admin/projects': [{ status: 200, body: [oficina, casa] }],
    });
    renderRoutes([{ path: '/trabajos', element: <ProjectsPage /> }], '/trabajos');
    await waitFor(() => expect(titles()).toEqual(['Oficina en Palermo', 'Casa en Lomas']));
    expect(screen.getByText('Durlock · 2025 · Destacado')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Publicar Casa en Lomas' })).not.toBeChecked();
  });

  it('el filtro por servicio muestra solo sus trabajos, actualiza la URL y bloquea el orden', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      'GET /api/admin/services': [{ status: 200, body: services }],
      'GET /api/admin/projects': [{ status: 200, body: [oficina, casa] }],
      'GET /api/admin/projects?serviceId=pintura': [{ status: 200, body: [casa] }],
    });
    const { router } = renderRoutes(
      [{ path: '/trabajos', element: <ProjectsPage /> }],
      '/trabajos',
    );
    await waitFor(() => expect(titles()).toHaveLength(2));

    const filter = screen.getByLabelText('Servicio');
    await waitFor(() =>
      expect(within(filter).getByRole('option', { name: 'Pintura' })).toBeInTheDocument(),
    );
    await user.selectOptions(filter, 'Pintura');

    await waitFor(() => expect(titles()).toEqual(['Casa en Lomas']));
    expect(router.state.location.search).toBe('?servicio=pintura');
    expect(fetch.calls.at(-1)?.key).toBe('GET /api/admin/projects?serviceId=pintura');
    expect(await screen.findByRole('button', { name: 'Mover Casa en Lomas' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Nuevo trabajo' })).toHaveAttribute(
      'href',
      '/trabajos/nuevo?servicio=pintura',
    );
  });
});
