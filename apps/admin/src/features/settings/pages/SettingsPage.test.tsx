import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { settingsFixture } from '@/test/fixtures';
import { renderPage, signIn } from '@/test/render';
import { SettingsPage } from './SettingsPage';

const GET = 'GET /api/admin/settings';
const PATCH = 'PATCH /api/admin/settings';
const bodyOf = (init: RequestInit) => JSON.parse(String(init.body)) as Record<string, unknown>;

describe('SettingsPage', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('guarda solo el WhatsApp modificado y avisa que el sitio se actualiza en un minuto', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      [GET]: [{ status: 200, body: settingsFixture() }],
      [PATCH]: [{ status: 200, body: settingsFixture({ whatsappNumber: '5491122334455' }) }],
    });
    renderPage(<SettingsPage />);

    const whatsapp = await screen.findByLabelText('WhatsApp');
    expect(whatsapp).toHaveAccessibleDescription(/Ej\.: 5491122334455/);
    await user.clear(whatsapp);
    await user.type(whatsapp, '5491122334455');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Cambios guardados')).toBeInTheDocument();
    expect(screen.getByText('El sitio se actualiza en hasta un minuto.')).toBeInTheDocument();
    const patch = fetch.calls.find((c) => c.key === PATCH)!;
    expect(bodyOf(patch.init)).toEqual({ whatsappNumber: '5491122334455' });
  });

  it('un WhatsApp con formato inválido muestra el error junto al campo, lo enfoca y no envía nada', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({ [GET]: [{ status: 200, body: settingsFixture() }] });
    renderPage(<SettingsPage />);

    const whatsapp = await screen.findByLabelText('WhatsApp');
    await user.clear(whatsapp);
    await user.type(whatsapp, '+54 11 2233-4455');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(whatsapp).toHaveAttribute('aria-invalid', 'true'));
    expect(whatsapp).toHaveAccessibleDescription(/Solo números en formato internacional/);
    expect(whatsapp).toHaveFocus();
    expect(fetch.calls.map((c) => c.key)).toEqual([GET]);
  });

  it('una red vaciada se envía como null', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      [GET]: [
        { status: 200, body: settingsFixture({ instagramUrl: 'https://instagram.com/tamila' }) },
      ],
      [PATCH]: [{ status: 200, body: settingsFixture() }],
    });
    renderPage(<SettingsPage />);
    await user.clear(await screen.findByLabelText('Instagram'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetch.calls.some((c) => c.key === PATCH)).toBe(true));
    expect(bodyOf(fetch.calls.find((c) => c.key === PATCH)!.init)).toEqual({ instagramUrl: null });
  });

  it('un error de la API sobre la imagen va a su campo', async () => {
    const user = userEvent.setup();
    mockFetch({
      [GET]: [{ status: 200, body: settingsFixture() }],
      [PATCH]: [
        {
          status: 400,
          body: {
            message: 'Los datos enviados no son válidos',
            errors: [{ field: 'heroImageId', message: 'La imagen no existe' }],
          },
        },
      ],
    });
    renderPage(<SettingsPage />);
    await user.type(await screen.findByLabelText('Título'), '!');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('La imagen no existe')).toBeInTheDocument();
  });
});
