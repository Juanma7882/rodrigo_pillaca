import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@/features/auth';
import {
  applyApiErrors,
  ConfirmDialog,
  Field,
  notifySaved,
  pickDirty,
  PublishSwitch,
  SortableList,
  useReorder,
  useUnsavedChanges,
} from '@/features/content';
import { Button, Input, Skeleton, Textarea, toast } from '@tamila/ui';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm, type FieldValues, type Path } from 'react-hook-form';
import type { z } from 'zod';
import type { faqsApi, stepsApi } from './api';

type TextField = { name: string; label: string; multiline?: boolean };
type SectionApi = typeof stepsApi | typeof faqsApi;
type Item = { id: string; published?: boolean } & Record<string, unknown>;

type SectionEditorProps = {
  api: SectionApi;
  /** Campos de texto de cada elemento (título/descripción o pregunta/respuesta). */
  fields: TextField[];
  createSchema: z.ZodType<FieldValues, FieldValues>;
  updateSchema: z.ZodType<FieldValues, FieldValues>;
  /** Las preguntas se pueden publicar u ocultar; los pasos no. */
  publishable?: boolean;
  /** Nombre de cada elemento (asa, borrado, anuncios). */
  itemLabel: (item: Item) => string;
  singular: string;
  addLabel: string;
  listLabel: string;
};

/**
 * Lista editable en línea: cada fila es un formulario chico con su botón de guardar, se ordena
 * arrastrando y los elementos nuevos se agregan al final.
 */
export function SectionEditor(props: SectionEditorProps) {
  const { api, itemLabel, listLabel } = props;
  const list = api.useList();
  const reorder = useReorder<Item>(api.key, api.saveOrder as (ids: string[]) => Promise<Item[]>);
  const [dirtyRows, setDirtyRows] = useState<Set<string>>(new Set());
  const unsaved = useUnsavedChanges(dirtyRows.size > 0);

  const onDirtyChange = useCallback((key: string, dirty: boolean) => {
    setDirtyRows((current) => {
      if (current.has(key) === dirty) return current;
      const next = new Set(current);
      if (dirty) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  if (list.isPending) return <Skeleton className="h-64 w-full" />;
  if (list.isError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        No se pudo cargar la lista.{' '}
        <Button variant="outline" size="sm" onClick={() => void list.refetch()}>
          Reintentar
        </Button>
      </p>
    );
  }
  const items = list.data as Item[];

  return (
    <div className="flex flex-col gap-6">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay elementos.</p>
      ) : (
        <SortableList
          label={listLabel}
          items={items}
          getLabel={itemLabel}
          onReorder={(next) => reorder.mutate(next)}
          renderItem={(item, handle) => (
            <ItemForm {...props} item={item} handle={handle} onDirtyChange={onDirtyChange} />
          )}
        />
      )}
      <NewItemForm {...props} onDirtyChange={onDirtyChange} onCreated={unsaved.allowNavigation} />
      {unsaved.dialog}
    </div>
  );
}

type RowProps = SectionEditorProps & { onDirtyChange: (key: string, dirty: boolean) => void };

function ItemForm({
  api,
  fields,
  updateSchema,
  publishable,
  itemLabel,
  singular,
  item,
  handle,
  onDirtyChange,
}: RowProps & { item: Item; handle: React.ReactNode }) {
  const update = api.useUpdate();
  const remove = api.useDelete();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const values = Object.fromEntries(fields.map((f) => [f.name, item[f.name] ?? '']));
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm<FieldValues>({ resolver: zodResolver(updateSchema), defaultValues: values });

  useEffect(() => onDirtyChange(item.id, isDirty), [item.id, isDirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(item.id, false), [item.id, onDirtyChange]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const saved = await update.mutateAsync({ id: item.id, input: pickDirty(data, dirtyFields) });
      reset(Object.fromEntries(fields.map((f) => [f.name, (saved as Item)[f.name] ?? ''])));
      notifySaved();
    } catch (error) {
      applyApiErrors(error, setError);
    }
  });

  const togglePublished = (published: boolean) =>
    update.mutate(
      { id: item.id, input: { published } },
      {
        onSuccess: () => notifySaved(published ? 'Publicada' : 'Quedó oculta'),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar'),
      },
    );

  const label = itemLabel(item);
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={`${singular} ${String(item.order)}`}
      className="flex gap-2 rounded-lg border bg-background p-3"
    >
      <div className="pt-6">{handle}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {fields.map((field) => (
          <Field
            key={field.name}
            label={field.label}
            error={errors[field.name]?.message as string | undefined}
          >
            {(aria) =>
              field.multiline ? (
                <Textarea rows={3} {...aria} {...register(field.name as Path<FieldValues>)} />
              ) : (
                <Input {...aria} {...register(field.name as Path<FieldValues>)} />
              )
            }
          </Field>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {publishable ? (
            <PublishSwitch
              checked={!!item.published}
              itemName={label}
              disabled={update.isPending}
              onCheckedChange={togglePublished}
            />
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              className="min-h-11 text-destructive md:min-h-9"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 aria-hidden /> Borrar
            </Button>
            {isDirty && (
              <Button type="submit" className="min-h-11 md:min-h-9" disabled={isSubmitting}>
                {isSubmitting && <Loader2 aria-hidden className="animate-spin" />}
                {isSubmitting ? 'Guardando…' : 'Guardar'}
              </Button>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`¿Borrar "${label}"?`}
        description="Se borra del sitio y el resto se renumera. No se puede deshacer."
        confirmLabel="Borrar"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(item.id, {
            onSuccess: () => {
              setConfirmDelete(false);
              toast.success(`"${label}" borrado`);
            },
            onError: (error) => {
              setConfirmDelete(false);
              toast.error(error instanceof ApiError ? error.message : 'No se pudo borrar');
            },
          })
        }
      />
    </form>
  );
}

function NewItemForm({
  api,
  fields,
  createSchema,
  publishable,
  addLabel,
  onDirtyChange,
  onCreated,
}: RowProps & { onCreated: () => void }) {
  const create = api.useCreate();
  const empty = {
    ...Object.fromEntries(fields.map((f) => [f.name, ''])),
    ...(publishable && { published: true }),
  };
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FieldValues>({ resolver: zodResolver(createSchema), defaultValues: empty });

  useEffect(() => onDirtyChange('nuevo', isDirty), [isDirty, onDirtyChange]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await create.mutateAsync(data);
      reset(empty);
      onCreated();
      notifySaved('Agregado al final de la lista');
    } catch (error) {
      applyApiErrors(error, setError);
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={addLabel}
      className="flex flex-col gap-3 rounded-lg border border-dashed p-4"
    >
      <h2 className="font-bold">{addLabel}</h2>
      {fields.map((field) => (
        <Field
          key={field.name}
          label={field.label}
          error={errors[field.name]?.message as string | undefined}
        >
          {(aria) =>
            field.multiline ? (
              <Textarea rows={3} {...aria} {...register(field.name as Path<FieldValues>)} />
            ) : (
              <Input {...aria} {...register(field.name as Path<FieldValues>)} />
            )
          }
        </Field>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {publishable ? (
          <Controller
            control={control}
            name="published"
            render={({ field }) => (
              <PublishSwitch checked={!!field.value} onCheckedChange={field.onChange} />
            )}
          />
        ) : (
          <span />
        )}
        <Button type="submit" className="min-h-11" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 aria-hidden className="animate-spin" /> : <Plus aria-hidden />}
          {addLabel}
        </Button>
      </div>
    </form>
  );
}
