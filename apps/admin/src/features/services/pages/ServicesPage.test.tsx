import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { serviceFixture } from '@/test/fixtures';
import { mockRowLayout, moveWithKeyboard } from '@/test/layout-mock';
import { renderPage, signIn } from '@/test/render';
import { ServicesPage } from './ServicesPage';

mockRowLayout();

const LIST = 'GET /api/admin/services';
const durlock = serviceFixture('durlock', { order: 1, projectCount: 2 });
const gas = serviceFixture('gas', { order: 2, published: false });
const pintura = serviceFixture('pintura', { order: 3 });

const rowNames = () =>
  within(screen.getByRole('list', { name: 'Servicios' }))
    .getAllByRole('link')
    .map((l) => l.textContent);

describe('ServicesPage', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('lista los servicios con su capítulo (solo los publicados) y cantidad de trabajos', async () => {
    mockFetch({ [LIST]: [{ status: 200, body: [durlock, gas, pintura] }] });
    renderPage(<ServicesPage />, '/servicios');
    expect(await screen.findByText('Capítulo 01')).toBeInTheDocument();
    expect(screen.getByText('Capítulo 02')).toBeInTheDocument();
    expect(screen.getByText('No publicado')).toBeInTheDocument();
    expect(screen.getByText('2 trabajos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nuevo servicio' })).toHaveAttribute(
      'href',
      '/servicios/nuevo',
    );
  });

  it('reordenar con el teclado muestra el nuevo orden al instante y lo guarda', async () => {
    const fetch = mockFetch({
      [LIST]: [{ status: 200, body: [durlock, gas, pintura] }],
      'PUT /api/admin/services/order': [{ status: 200, body: [pintura, durlock, gas] }],
    });
    renderPage(<ServicesPage />, '/servicios');
    await screen.findByText('Capítulo 01');

    await moveWithKeyboard(await screen.findByRole('button', { name: 'Mover Pintura' }), -2);
    await waitFor(() => expect(rowNames()).toEqual(['Pintura', 'Durlock', 'Gas']));
    const put = fetch.calls.find((c) => c.key === 'PUT /api/admin/services/order')!;
    expect(JSON.parse(String(put.init.body))).toEqual({ ids: ['pintura', 'durlock', 'gas'] });
  });

  it('despublicar desde la lista actualiza el estado', async () => {
    const user = userEvent.setup();
    const hidden = { ...pintura, published: false };
    const fetch = mockFetch({
      [LIST]: [
        { status: 200, body: [durlock, gas, pintura] },
        { status: 200, body: [durlock, gas, hidden] },
      ],
      'PATCH /api/admin/services/pintura': [{ status: 200, body: hidden }],
    });
    renderPage(<ServicesPage />, '/servicios');
    await user.click(await screen.findByRole('switch', { name: 'Publicar Pintura' }));

    expect(await screen.findByText('Pintura quedó oculto')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('No publicado')).toHaveLength(2));
    expect(screen.getByRole('switch', { name: 'Publicar Pintura' })).not.toBeChecked();
    expect(screen.queryByText('Capítulo 02')).not.toBeInTheDocument();
    const patch = fetch.calls.find((c) => c.key === 'PATCH /api/admin/services/pintura')!;
    expect(JSON.parse(String(patch.init.body))).toEqual({ published: false });
  });
});
