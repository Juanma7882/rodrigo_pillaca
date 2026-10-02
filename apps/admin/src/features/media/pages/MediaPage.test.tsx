import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { mediaFixture, mediaPage, usage } from '@/test/fixtures';
import { renderPage, signIn } from '@/test/render';
import { mockXhr } from '@/test/xhr-mock';
import { MediaPage } from './MediaPage';

const LIST = 'GET /api/admin/media?page=1&pageSize=24';
const photo = (name: string, type = 'image/jpeg') => new File(['x'], name, { type });

const libraryNames = () =>
  within(screen.getByRole('list', { name: 'Biblioteca de imágenes' }))
    .getAllByRole('button')
    .map((b) => b.getAttribute('aria-label'));

describe('MediaPage', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('muestra la biblioteca con el peso y si se usa cada imagen', async () => {
    mockFetch({
      [LIST]: [
        {
          status: 200,
          body: mediaPage([
            mediaFixture('a', { usages: [usage('serviceCover', 's1', 'Portada de Durlock')] }),
            mediaFixture('b', { totalBytes: 1_572_864 }),
          ]),
        },
      ],
    });
    renderPage(<MediaPage />);
    expect(await screen.findByText('2 imágenes')).toBeInTheDocument();
    const grid = within(screen.getByRole('list', { name: 'Biblioteca de imágenes' }));
    expect(grid.getByText('En 1 lugar')).toBeInTheDocument();
    expect(grid.getByText('Sin usar')).toBeInTheDocument();
    expect(grid.getByText('1,5 MB')).toBeInTheDocument();
  });

  it('subir tres fotos las muestra al principio de la biblioteca', async () => {
    const user = userEvent.setup();
    const uploaded = ['n1', 'n2', 'n3'].map((id) => mediaFixture(id, { alt: `Obra ${id}` }));
    mockFetch({
      [LIST]: [
        { status: 200, body: mediaPage([mediaFixture('vieja', { alt: 'Vieja' })]) },
        {
          status: 200,
          body: mediaPage([...uploaded].reverse().concat(mediaFixture('vieja', { alt: 'Vieja' }))),
        },
      ],
    });
    const xhr = mockXhr(uploaded.map((body) => ({ status: 201, body })));
    renderPage(<MediaPage />);
    await screen.findByText('1 imagen');

    await user.upload(screen.getByLabelText('Elegir fotos'), [
      photo('obra-1.jpg'),
      photo('obra-2.jpg'),
      photo('obra-3.jpg'),
    ]);
    const altInput = screen.getByLabelText('Texto alternativo de obra-1.jpg');
    expect(altInput).toHaveValue('obra 1');
    await user.clear(altInput);
    await user.type(altInput, 'Living con piso flotante');
    await user.click(screen.getByRole('button', { name: 'Subir 3 fotos' }));

    await waitFor(() => expect(screen.getAllByText('Subida')).toHaveLength(3));
    expect(xhr.requests.map((r) => r.body.get('alt'))).toEqual([
      'Living con piso flotante',
      'obra 2',
      'obra 3',
    ]);
    await waitFor(() =>
      expect(libraryNames()).toEqual(['Ver Obra n3', 'Ver Obra n2', 'Ver Obra n1', 'Ver Vieja']),
    );
  });

  it('una foto que falla se puede reintentar sin volver a elegirla', async () => {
    const user = userEvent.setup();
    mockFetch({
      [LIST]: [
        { status: 200, body: mediaPage([]) },
        { status: 200, body: mediaPage([mediaFixture('n1')]) },
        { status: 200, body: mediaPage([mediaFixture('n1')]) },
      ],
    });
    const xhr = mockXhr([{ networkError: true }, { status: 201, body: mediaFixture('n1') }]);
    renderPage(<MediaPage />);
    await screen.findByText('0 imágenes');

    await user.upload(screen.getByLabelText('Elegir fotos'), [photo('obra.jpg')]);
    await user.click(screen.getByRole('button', { name: 'Subir 1 foto' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/conectarnos/);

    await user.click(screen.getByRole('button', { name: 'Reintentar obra.jpg' }));
    expect(await screen.findByText('Subida')).toBeInTheDocument();
    expect(xhr.requests).toHaveLength(2);
  });

  it('un archivo con formato no admitido explica cómo exportar una HEIC', async () => {
    const user = userEvent.setup({ applyAccept: false });
    mockFetch({ [LIST]: [{ status: 200, body: mediaPage([]) }] });
    renderPage(<MediaPage />);
    await user.upload(screen.getByLabelText('Elegir fotos'), [photo('IMG_1.HEIC', 'image/heic')]);
    expect(await screen.findByRole('alert')).toHaveTextContent(/exportala como JPEG/);
    expect(screen.getByRole('button', { name: 'Subir 0 fotos' })).toBeDisabled();
  });

  it('no borra una imagen en uso y muestra dónde se usa', async () => {
    const user = userEvent.setup();
    const hero = mediaFixture('h', { alt: 'Casa', usages: [usage('hero', '1', 'Foto del hero')] });
    const fetch = mockFetch({
      [LIST]: [{ status: 200, body: mediaPage([hero]) }],
      'DELETE /api/admin/media/h': [
        {
          status: 409,
          body: {
            message:
              'La imagen está en uso (Foto del hero): quitala de esos lugares antes de borrarla',
          },
        },
      ],
    });
    renderPage(<MediaPage />);
    await user.click(await screen.findByRole('button', { name: 'Ver Casa' }));

    const dialog = await screen.findByRole('dialog', { name: 'Imagen' });
    expect(within(dialog).getByRole('link', { name: 'Foto del hero' })).toHaveAttribute(
      'href',
      '/configuracion',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Borrar' }));
    const confirm = await screen.findByRole('alertdialog', { name: '¿Borrar la imagen?' });
    expect(confirm).toHaveTextContent('Foto del hero');
    await user.click(within(confirm).getByRole('button', { name: 'Borrar' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/está en uso/);
    expect(fetch.calls.map((c) => c.key)).toContain('DELETE /api/admin/media/h');
  });

  it('el filtro "Sin usar" pide solo las imágenes sin uso', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      [LIST]: [{ status: 200, body: mediaPage([mediaFixture('a')]) }],
      'GET /api/admin/media?page=1&pageSize=24&unused=true': [
        { status: 200, body: mediaPage([mediaFixture('b', { alt: 'Suelta' })]) },
      ],
    });
    renderPage(<MediaPage />);
    await screen.findByText('1 imagen');
    await user.click(screen.getByRole('tab', { name: 'Sin usar' }));
    await waitFor(() => expect(libraryNames()).toEqual(['Ver Suelta']));
    expect(fetch.calls.at(-1)?.key).toBe('GET /api/admin/media?page=1&pageSize=24&unused=true');
  });
});
