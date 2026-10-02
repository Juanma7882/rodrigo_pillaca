import { ApiError } from '@/features/auth';
import { Button } from '@tamila/ui';
import { useQuery } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderPage } from '@/test/render';
import { PublishSwitch } from './PublishSwitch';
import { useReorder } from './useReorder';

type Item = { id: string; name: string };
const initial: Item[] = [
  { id: 'a', name: 'Durlock' },
  { id: 'b', name: 'Pintura' },
];

function Demo({ save }: { save: (ids: string[]) => Promise<Item[]> }) {
  const { data = [] } = useQuery({
    queryKey: ['demo'],
    queryFn: async () => initial,
    staleTime: Infinity,
  });
  const reorder = useReorder<Item>(['demo'], save);
  return (
    <div>
      <ol aria-label="Lista">
        {data.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ol>
      <Button onClick={() => reorder.mutate([...data].reverse())}>Invertir</Button>
    </div>
  );
}

const names = () =>
  Array.from(
    screen.getByRole('list', { name: 'Lista' }).querySelectorAll('li'),
    (li) => li.textContent,
  );

describe('useReorder', () => {
  it('muestra el nuevo orden al instante y envía los ids', async () => {
    const save = vi.fn(async (ids: string[]) => ids.map((id) => initial.find((i) => i.id === id)!));
    renderPage(<Demo save={save} />);
    await screen.findByText('Durlock');
    await userEvent.click(screen.getByRole('button', { name: 'Invertir' }));
    await waitFor(() => expect(names()).toEqual(['Pintura', 'Durlock']));
    expect(save).toHaveBeenCalledWith(['b', 'a']);
  });

  it('si la API lo rechaza, vuelve al orden anterior y avisa', async () => {
    let reject!: (error: unknown) => void;
    const save = vi.fn(() => new Promise<Item[]>((_, r) => (reject = r)));
    renderPage(<Demo save={save} />);
    await screen.findByText('Durlock');
    await userEvent.click(screen.getByRole('button', { name: 'Invertir' }));
    await waitFor(() => expect(names()).toEqual(['Pintura', 'Durlock']));

    reject(new ApiError(400, 'La lista tiene que incluir todos los elementos'));
    await waitFor(() => expect(names()).toEqual(['Durlock', 'Pintura']));
    expect(await screen.findByText('No se pudo guardar el nuevo orden')).toBeInTheDocument();
    expect(screen.getByText('La lista tiene que incluir todos los elementos')).toBeInTheDocument();
  });
});

describe('PublishSwitch', () => {
  it('muestra el estado y avisa el cambio', async () => {
    const onChange = vi.fn();
    renderPage(<PublishSwitch checked={false} onCheckedChange={onChange} itemName="Gas" />);
    expect(screen.getByText('No publicado')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('switch', { name: 'Publicar Gas' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
