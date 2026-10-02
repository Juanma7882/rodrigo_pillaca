import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRowLayout } from '@/test/layout-mock';
import { SortableList } from './SortableList';

const items = ['Durlock', 'Steelframe', 'Pintura', 'Gas'].map((name, i) => ({ id: `s${i}`, name }));

mockRowLayout();

const renderList = (onReorder = vi.fn()) => {
  render(
    <SortableList
      label="Servicios"
      items={items}
      getLabel={(item) => item.name}
      onReorder={onReorder}
      renderItem={(item, handle) => (
        <div>
          {handle}
          <span>{item.name}</span>
        </div>
      )}
    />,
  );
  return onReorder;
};

describe('SortableList', () => {
  it('cada fila tiene un asa con nombre accesible', () => {
    renderList();
    expect(
      screen.getAllByRole('button', { name: /^Mover / }).map((b) => b.getAttribute('aria-label')),
    ).toEqual(['Mover Durlock', 'Mover Steelframe', 'Mover Pintura', 'Mover Gas']);
  });

  it('con el teclado: Espacio, dos flechas abajo y Espacio mueve el elemento dos lugares', async () => {
    const onReorder = renderList();
    const handle = screen.getByRole('button', { name: 'Mover Durlock' });
    handle.focus();

    fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.keyDown(handle, { code: 'ArrowDown', key: 'ArrowDown' });
    fireEvent.keyDown(handle, { code: 'ArrowDown', key: 'ArrowDown' });
    fireEvent.keyDown(handle, { code: 'Space', key: ' ' });

    await waitFor(() => expect(onReorder).toHaveBeenCalledTimes(1));
    expect(onReorder.mock.calls[0]![0].map((i: { name: string }) => i.name)).toEqual([
      'Steelframe',
      'Pintura',
      'Durlock',
      'Gas',
    ]);
    expect(screen.getByText(/Soltaste Durlock en la posición 3 de 4/)).toBeInTheDocument();
  });

  it('Escape cancela sin reordenar', async () => {
    const onReorder = renderList();
    const handle = screen.getByRole('button', { name: 'Mover Pintura' });
    handle.focus();
    fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.keyDown(handle, { code: 'ArrowUp', key: 'ArrowUp' });
    fireEvent.keyDown(handle, { code: 'Escape', key: 'Escape' });
    await waitFor(() =>
      expect(screen.getByText(/Cancelaste el movimiento de Pintura/)).toBeInTheDocument(),
    );
    expect(onReorder).not.toHaveBeenCalled();
  });
});
