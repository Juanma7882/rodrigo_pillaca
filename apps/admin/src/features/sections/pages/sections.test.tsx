import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { faqFixture, stepFixture } from '@/test/fixtures';
import { mockRowLayout, moveWithKeyboard } from '@/test/layout-mock';
import { renderPage, signIn } from '@/test/render';
import { FaqsPage } from './FaqsPage';
import { ProcessStepsPage } from './ProcessStepsPage';

mockRowLayout();

const bodyOf = (init: RequestInit) => JSON.parse(String(init.body)) as Record<string, unknown>;
const steps = [
  stepFixture('s1', 1, 'Contacto'),
  stepFixture('s2', 2, 'Visita'),
  stepFixture('s3', 3, 'Presupuesto'),
];
const listedQuestions = () =>
  within(screen.getByRole('list', { name: 'Preguntas' }))
    .getAllByLabelText('Pregunta')
    .map((input) => (input as HTMLInputElement).value);

describe('Cómo trabajamos', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('editar una fila envía solo esa fila y solo lo modificado', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      'GET /api/admin/process-steps': [{ status: 200, body: steps }],
      'PATCH /api/admin/process-steps/s2': [
        { status: 200, body: { ...steps[1], title: 'Visita y medición' } },
      ],
    });
    renderPage(<ProcessStepsPage />);
    const row = await screen.findByRole('form', { name: 'Paso 2' });
    const title = within(row).getByLabelText('Título');
    await user.clear(title);
    await user.type(title, 'Visita y medición');
    expect(
      within(screen.getByRole('form', { name: 'Paso 1' })).queryByRole('button', {
        name: 'Guardar',
      }),
    ).toBeNull();
    await user.click(within(row).getByRole('button', { name: 'Guardar' }));

    await screen.findByText('Cambios guardados');
    const patch = fetch.calls.find((c) => c.key.startsWith('PATCH'))!;
    expect(patch.key).toBe('PATCH /api/admin/process-steps/s2');
    expect(bodyOf(patch.init)).toEqual({ title: 'Visita y medición' });
  });

  it('reordenar con el teclado guarda el nuevo orden', async () => {
    const fetch = mockFetch({
      'GET /api/admin/process-steps': [{ status: 200, body: steps }],
      'PUT /api/admin/process-steps/order': [{ status: 200, body: [steps[2], steps[0], steps[1]] }],
    });
    renderPage(<ProcessStepsPage />);
    await moveWithKeyboard(await screen.findByRole('button', { name: 'Mover Presupuesto' }), -2);
    await waitFor(() => expect(fetch.calls.some((c) => c.key.startsWith('PUT'))).toBe(true));
    expect(bodyOf(fetch.calls.find((c) => c.key.startsWith('PUT'))!.init)).toEqual({
      ids: ['s3', 's1', 's2'],
    });
  });

  it('borrar pide confirmación y vuelve a pedir la lista renumerada', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      'GET /api/admin/process-steps': [
        { status: 200, body: steps },
        { status: 200, body: [steps[0], { ...steps[2], order: 2 }] },
      ],
      'DELETE /api/admin/process-steps/s2': [{ status: 204 }],
    });
    renderPage(<ProcessStepsPage />);
    const row = await screen.findByRole('form', { name: 'Paso 2' });
    await user.click(within(row).getByRole('button', { name: 'Borrar' }));
    const dialog = await screen.findByRole('alertdialog', { name: '¿Borrar "Visita"?' });
    await user.click(within(dialog).getByRole('button', { name: 'Borrar' }));
    await waitFor(() =>
      expect(screen.queryByRole('form', { name: 'Paso 3' })).not.toBeInTheDocument(),
    );
    expect(fetch.calls.map((c) => c.key)).toContain('DELETE /api/admin/process-steps/s2');
  });
});

describe('Preguntas frecuentes', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('agregar una pregunta la deja última y publicada por defecto', async () => {
    const user = userEvent.setup();
    const nueva = faqFixture('f3', 3, '¿Trabajan los sábados?');
    const fetch = mockFetch({
      'GET /api/admin/faqs': [{ status: 200, body: [faqFixture('f1', 1), faqFixture('f2', 2)] }],
      'POST /api/admin/faqs': [{ status: 201, body: nueva }],
    });
    renderPage(<FaqsPage />);
    const form = await screen.findByRole('form', { name: 'Agregar pregunta' });
    await user.type(within(form).getByLabelText('Pregunta'), '¿Trabajan los sábados?');
    await user.type(within(form).getByLabelText('Respuesta'), 'Sí, de 8 a 13 h.');
    await user.click(within(form).getByRole('button', { name: 'Agregar pregunta' }));

    await waitFor(() =>
      expect(listedQuestions()).toEqual(['¿Pregunta 1?', '¿Pregunta 2?', '¿Trabajan los sábados?']),
    );
    expect(bodyOf(fetch.calls.find((c) => c.key.startsWith('POST'))!.init)).toEqual({
      question: '¿Trabajan los sábados?',
      answer: 'Sí, de 8 a 13 h.',
      published: true,
    });
    expect(within(form).getByLabelText('Pregunta')).toHaveValue('');
  });

  it('una pregunta vacía no se envía y despublicar guarda al instante', async () => {
    const user = userEvent.setup();
    const fetch = mockFetch({
      'GET /api/admin/faqs': [
        { status: 200, body: [faqFixture('f1', 1, '¿Cobran el presupuesto?')] },
      ],
      'PATCH /api/admin/faqs/f1': [
        { status: 200, body: faqFixture('f1', 1, '¿Cobran el presupuesto?', false) },
      ],
    });
    renderPage(<FaqsPage />);
    const form = await screen.findByRole('form', { name: 'Agregar pregunta' });
    await user.click(within(form).getByRole('button', { name: 'Agregar pregunta' }));
    await waitFor(() =>
      expect(within(form).getByLabelText('Pregunta')).toHaveAttribute('aria-invalid', 'true'),
    );

    await user.click(screen.getByRole('switch', { name: 'Publicar ¿Cobran el presupuesto?' }));
    await waitFor(() => expect(fetch.calls.some((c) => c.key.startsWith('PATCH'))).toBe(true));
    expect(bodyOf(fetch.calls.find((c) => c.key.startsWith('PATCH'))!.init)).toEqual({
      published: false,
    });
    expect(fetch.calls.some((c) => c.key.startsWith('POST'))).toBe(false);
  });
});
