import { Input, Label } from '@tamila/ui';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { renderRoutes } from '@/test/render';
import { FormActions } from './FormActions';
import { useUnsavedChanges } from './useUnsavedChanges';

/** Formulario mínimo con las piezas compartidas, como lo usan las pantallas de edición. */
function DemoForm({ save }: { save: (name: string) => Promise<void> }) {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm({ defaultValues: { name: 'Durlock' } });
  const unsaved = useUnsavedChanges(isDirty);

  const onSubmit = handleSubmit(async (values) => {
    await save(values.name);
    reset(values);
    unsaved.allowNavigation();
    navigate('/lista');
  });

  return (
    <form onSubmit={onSubmit}>
      <Label htmlFor="name">Nombre</Label>
      <Input id="name" {...register('name')} />
      <Link to="/otra">Ir a otra sección</Link>
      <FormActions isSubmitting={isSubmitting} />
      {unsaved.dialog}
    </form>
  );
}

const renderForm = (save: (name: string) => Promise<void> = vi.fn(async () => undefined)) => {
  const view = renderRoutes(
    [
      { path: '/form', element: <DemoForm save={save} /> },
      { path: '/otra', element: <h1>Otra sección</h1> },
      { path: '/lista', element: <h1>Lista</h1> },
    ],
    '/form',
  );
  return { ...view, save, user: userEvent.setup() };
};

describe('useUnsavedChanges', () => {
  it('sin cambios navega sin preguntar', async () => {
    const { user } = renderForm();
    await user.click(screen.getByRole('link', { name: 'Ir a otra sección' }));
    expect(await screen.findByRole('heading', { name: 'Otra sección' })).toBeInTheDocument();
  });

  it('con cambios pide confirmación y "Seguir editando" conserva lo escrito', async () => {
    const { user } = renderForm();
    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'Durlock y yeso');
    await user.click(screen.getByRole('link', { name: 'Ir a otra sección' }));

    const dialog = await screen.findByRole('alertdialog', { name: '¿Descartar los cambios?' });
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Seguir editando' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText('Nombre')).toHaveValue('Durlock y yeso');
  });

  it('"Descartar y salir" navega', async () => {
    const { user } = renderForm();
    await user.type(screen.getByLabelText('Nombre'), ' x');
    await user.click(screen.getByRole('link', { name: 'Ir a otra sección' }));
    await user.click(await screen.findByRole('button', { name: 'Descartar y salir' }));
    expect(await screen.findByRole('heading', { name: 'Otra sección' })).toBeInTheDocument();
  });

  it('después de guardar navega sin preguntar', async () => {
    const { user, save } = renderForm();
    await user.type(screen.getByLabelText('Nombre'), ' x');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('heading', { name: 'Lista' })).toBeInTheDocument();
    expect(save).toHaveBeenCalledWith('Durlock x');
  });
});

describe('FormActions', () => {
  it('mientras guarda deshabilita el botón y un doble toque envía una sola vez', async () => {
    let finish!: () => void;
    const save = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { user } = renderForm(save);
    await user.type(screen.getByLabelText('Nombre'), ' x');
    const button = screen.getByRole('button', { name: 'Guardar' });
    await user.dblClick(button);

    expect(await screen.findByRole('button', { name: 'Guardando…' })).toBeDisabled();
    expect(save).toHaveBeenCalledTimes(1);
    finish();
    expect(await screen.findByRole('heading', { name: 'Lista' })).toBeInTheDocument();
  });
});
