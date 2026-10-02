import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@tamila/ui';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

type SortableListProps<T extends { id: string }> = {
  items: T[];
  /** Nombre legible de cada elemento (asa y anuncios para lectores de pantalla). */
  getLabel: (item: T) => string;
  /** Recibe la lista completa en el nuevo orden, y de qué posición a cuál se movió. */
  onReorder: (items: T[], move: { from: number; to: number }) => void;
  renderItem: (item: T, handle: ReactNode) => ReactNode;
  /** Nombre de la lista para lectores de pantalla. */
  label: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Lista que se reordena arrastrando desde un asa: con el mouse, con el dedo (tras mantener
 * apretado un instante, así el resto de la fila desplaza la página) o con el teclado
 * (Espacio para tomar, flechas para mover, Espacio para soltar y Escape para cancelar).
 */
export function SortableList<T extends { id: string }>({
  items,
  getLabel,
  onReorder,
  renderItem,
  label,
  disabled = false,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const labelOf = (id: UniqueIdentifier) => {
    const item = items.find((i) => i.id === id);
    return item ? getLabel(item) : '';
  };
  const positionOf = (id: UniqueIdentifier | undefined) => items.findIndex((i) => i.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Tomaste ${labelOf(active.id)}. Está en la posición ${positionOf(active.id)} de ${items.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} pasa a la posición ${positionOf(over.id)} de ${items.length}.`
        : `${labelOf(active.id)} está fuera de la lista.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `Soltaste ${labelOf(active.id)} en la posición ${positionOf(over.id)} de ${items.length}.`
        : `Soltaste ${labelOf(active.id)} sin moverlo.`,
    onDragCancel: ({ active }) => `Cancelaste el movimiento de ${labelOf(active.id)}.`,
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, from, to), { from, to });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            'Para mover este elemento, presioná Espacio, usá las flechas para elegir el lugar y ' +
            'presioná Espacio otra vez para soltarlo. Escape cancela.',
        },
      }}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy} disabled={disabled}>
        <ul aria-label={label} className={cn('flex flex-col gap-2', className)}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id} label={getLabel(item)} disabled={disabled}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  label,
  disabled,
  children,
}: {
  id: string;
  label: string;
  disabled: boolean;
  children: (handle: ReactNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Mover ${label}`}
      disabled={disabled}
      // Solo el asa bloquea el gesto táctil del navegador: el resto de la fila hace scroll.
      style={{ touchAction: 'none' }}
      className="flex size-11 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
    >
      <GripVertical aria-hidden className="size-5" />
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-80 shadow-lg')}
    >
      {children(handle)}
    </li>
  );
}
