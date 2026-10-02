import type { MediaAsset } from '@tamila/shared';
import { Input, Label } from '@tamila/ui';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { mediaFixture, mediaPage } from '@/test/fixtures';
import { renderPage, signIn } from '@/test/render';
import { mockXhr } from '@/test/xhr-mock';
import { GalleryField, ImagePicker } from './ImagePicker';

const LIST = 'GET /api/admin/media?page=1&pageSize=24';

function CoverForm() {
  const [name, setName] = useState('');
  const [cover, setCover] = useState<MediaAsset | null>(null);
  return (
    <div>
      <Label htmlFor="name">Nombre</Label>
      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
      <ImagePicker label="Portada" value={cover} onChange={setCover} optional />
      <output aria-label="Portada elegida">{cover?.alt ?? 'ninguna'}</output>
    </div>
  );
}

function GalleryForm({ initial }: { initial: MediaAsset[] }) {
  const [images, setImages] = useState(initial);
  return (
    <div>
      <GalleryField label="Galería" value={images} onChange={setImages} />
      <output aria-label="Orden">{images.map((m) => m.alt).join(', ')}</output>
    </div>
  );
}

describe('ImagePicker', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('subir una foto desde el selector la deja elegida sin perder el resto del formulario', async () => {
    const user = userEvent.setup();
    mockFetch({
      [LIST]: [
        { status: 200, body: mediaPage([mediaFixture('vieja')]) },
        { status: 200, body: mediaPage([mediaFixture('nueva'), mediaFixture('vieja')]) },
      ],
    });
    mockXhr([{ status: 201, body: mediaFixture('nueva', { alt: 'Cielorraso terminado' }) }]);
    renderPage(<CoverForm />);

    await user.type(screen.getByLabelText('Nombre'), 'Durlock');
    await user.click(screen.getByRole('button', { name: 'Elegir portada' }));
    const dialog = await screen.findByRole('dialog', { name: 'Portada' });
    await user.click(within(dialog).getByRole('tab', { name: 'Subir' }));
    await user.upload(within(dialog).getByLabelText('Elegir fotos'), [
      new File(['x'], 'cielorraso.jpg', { type: 'image/jpeg' }),
    ]);
    await user.click(within(dialog).getByRole('button', { name: 'Subir 1 foto' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Portada elegida')).toHaveTextContent('Cielorraso terminado');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Durlock');
    expect(screen.getByRole('button', { name: 'Cambiar portada' })).toBeInTheDocument();
  });

  it('elegir de la biblioteca y vaciar un campo opcional', async () => {
    const user = userEvent.setup();
    mockFetch({
      [LIST]: [{ status: 200, body: mediaPage([mediaFixture('a', { alt: 'Living' })]) }],
    });
    renderPage(<CoverForm />);
    await user.click(screen.getByRole('button', { name: 'Elegir portada' }));
    await user.click(await screen.findByRole('button', { name: 'Elegir Living' }));
    expect(screen.getByLabelText('Portada elegida')).toHaveTextContent('Living');

    await user.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(screen.getByLabelText('Portada elegida')).toHaveTextContent('ninguna');
  });
});

describe('GalleryField', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('agrega varias fotos, no ofrece las que ya están y permite quitar una', async () => {
    const user = userEvent.setup();
    const [a, b, c] = ['A', 'B', 'C'].map((alt) => mediaFixture(alt.toLowerCase(), { alt }));
    mockFetch({ [LIST]: [{ status: 200, body: mediaPage([a!, b!, c!]) }] });
    renderPage(<GalleryForm initial={[a!]} />);

    await user.click(screen.getByRole('button', { name: 'Agregar fotos' }));
    const dialog = await screen.findByRole('dialog', { name: 'Galería' });
    await within(dialog).findByRole('button', { name: 'Elegir B' });
    expect(within(dialog).queryByRole('button', { name: 'Elegir A' })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Elegir C' }));
    await user.click(within(dialog).getByRole('button', { name: 'Elegir B' }));
    await user.click(within(dialog).getByRole('button', { name: 'Agregar 2 fotos' }));

    expect(screen.getByLabelText('Orden')).toHaveTextContent('A, C, B');
    await user.click(screen.getByRole('button', { name: 'Quitar C de la galería' }));
    expect(screen.getByLabelText('Orden')).toHaveTextContent('A, B');
    expect(screen.getAllByRole('button', { name: /^Mover / })).toHaveLength(2);
  });
});
