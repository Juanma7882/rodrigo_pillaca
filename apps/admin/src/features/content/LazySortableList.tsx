import { Skeleton } from '@tamila/ui';
import { lazy, Suspense, type ComponentProps } from 'react';
import type { SortableList as SortableListImpl } from './SortableList';

type Props<T extends { id: string }> = ComponentProps<typeof SortableListImpl<T>>;

// dnd-kit pesa ~30 KB: se descarga recién cuando se muestra una lista ordenable.
const Impl = lazy(() => import('./SortableList').then((m) => ({ default: m.SortableList })));

/**
 * Lista ordenable con carga diferida. Mientras carga muestra filas vacías (sin campos), así
 * nadie empieza a escribir en una fila que se va a volver a montar.
 */
export function SortableList<T extends { id: string }>(props: Props<T>) {
  return (
    <Suspense
      fallback={
        <ul aria-label={props.label} aria-busy className="flex flex-col gap-2">
          {props.items.map((item) => (
            <li key={item.id}>
              <Skeleton className="h-16 w-full rounded-lg" />
            </li>
          ))}
        </ul>
      }
    >
      <Impl {...(props as unknown as Props<{ id: string }>)} />
    </Suspense>
  );
}
