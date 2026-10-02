import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError } from '@/features/auth';
import {
  applyApiErrors,
  ConfirmDialog,
  Field,
  FormActions,
  FormSection,
  NativeSelect,
  notifySaved,
  PageHeader,
  pickDirty,
  PublishSwitch,
  slugify,
  SortableList,
  useUnsavedChanges,
} from '@/features/content';
import { GalleryField, ImagePicker } from '@/features/media';
import { useProjects } from '@/features/projects';
import {
  mediaAssetSchema,
  serviceCreateSchema,
  type AdminService,
  type ServiceCreateInput,
  type ServiceUpdateInput,
} from '@tamila/shared';
import { Button, Input, Skeleton, Textarea, toast } from '@tamila/ui';
import { ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { useCreateService, useDeleteService, useService, useUpdateService } from '../api';

const fields = serviceCreateSchema.shape;
/** Los mismos campos que valida la API; "qué incluye" como objetos (useFieldArray) e imágenes completas. */
const formSchema = z.object({
  name: fields.name,
  slug: fields.slug,
  tagline: fields.tagline,
  summary: fields.summary,
  description: fields.description,
  includes: z.array(z.object({ value: fields.includes.element })).max(30, 'Máximo 30 elementos'),
  seoTitle: fields.seoTitle,
  seoDescription: fields.seoDescription,
  published: z.boolean(),
  coverImage: mediaAssetSchema.nullable(),
  images: z.array(mediaAssetSchema),
  featuredProjectId: z.string().nullable(),
});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const emptyValues: FormInput = {
  name: '',
  slug: '',
  tagline: '',
  summary: '',
  description: '',
  includes: [],
  seoTitle: '',
  seoDescription: '',
  published: false,
  coverImage: null,
  images: [],
  featuredProjectId: null,
};

const toFormValues = (s: AdminService): FormInput => ({
  name: s.name,
  slug: s.slug,
  tagline: s.tagline,
  summary: s.summary,
  description: s.description,
  includes: s.includes.map((value) => ({ value })),
  seoTitle: s.seoTitle ?? '',
  seoDescription: s.seoDescription ?? '',
  published: s.published,
  coverImage: s.coverImage,
  images: s.images,
  featuredProjectId: s.featuredProjectId,
});

/** Campos del formulario → campos de la API. */
function toInput(values: Partial<FormOutput>): ServiceUpdateInput {
  const { includes, coverImage, images, ...rest } = values;
  return {
    ...rest,
    ...(includes !== undefined && { includes: includes.map((i) => i.value) }),
    ...(coverImage !== undefined && { coverImageId: coverImage?.id ?? null }),
    ...(images !== undefined && { imageIds: images.map((m) => m.id) }),
  };
}

const RENAME = { coverImageId: 'coverImage', imageIds: 'images' } as const;

export function ServiceFormPage() {
  const { id } = useParams();
  const isNew = id === 'nuevo';
  const service = useService(isNew ? undefined : id);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to="/servicios">
          <ArrowLeft aria-hidden /> Servicios
        </Link>
      </Button>
      {isNew ? (
        <ServiceForm />
      ) : service.data ? (
        <ServiceForm key={service.data.id} service={service.data} />
      ) : service.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {service.error instanceof ApiError && service.error.status === 404
            ? 'Ese servicio no existe.'
            : 'No se pudo cargar el servicio.'}
        </p>
      ) : (
        <Skeleton className="h-96 w-full" />
      )}
    </>
  );
}

function ServiceForm({ service }: { service?: AdminService }) {
  const navigate = useNavigate();
  const create = useCreateService();
  const update = useUpdateService();
  const remove = useDeleteService();
  const projects = useProjects(service?.id, { enabled: !!service });
  const [slugEdited, setSlugEdited] = useState(!!service);
  const [pendingSlugChange, setPendingSlugChange] = useState<FormOutput | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBlocked, setDeleteBlocked] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    getValues,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: service ? toFormValues(service) : emptyValues,
  });
  const includes = useFieldArray({ control, name: 'includes' });
  const unsaved = useUnsavedChanges(isDirty);

  const save = async (values: FormOutput) => {
    try {
      if (!service) {
        const created = await create.mutateAsync(toInput(values) as ServiceCreateInput);
        unsaved.allowNavigation();
        toast.success(`Servicio "${created.name}" creado`, {
          description: created.published
            ? 'El sitio se actualiza en hasta un minuto.'
            : 'Todavía no está publicado.',
        });
        navigate(`/servicios/${created.id}`, { replace: true });
        return;
      }
      const saved = await update.mutateAsync({
        id: service.id,
        input: toInput(pickDirty(values, dirtyFields)),
      });
      reset(toFormValues(saved));
      notifySaved();
    } catch (error) {
      applyApiErrors(error, setError, { conflictField: 'slug', rename: RENAME });
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    // Cambiar el slug de un servicio publicado rompe la dirección que ya conoce Google.
    if (service?.published && dirtyFields.slug && values.slug !== service.slug) {
      setPendingSlugChange(values);
      return;
    }
    await save(values);
  });

  const onDelete = () =>
    remove.mutate(service!.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        unsaved.allowNavigation();
        toast.success(`Servicio "${service!.name}" borrado`);
        navigate('/servicios', { replace: true });
      },
      onError: (error) => {
        setConfirmDelete(false);
        if (error instanceof ApiError && error.status === 409) setDeleteBlocked(error.message);
        else toast.error(error instanceof ApiError ? error.message : 'No se pudo borrar');
      },
    });

  const unpublish = () =>
    update.mutate(
      { id: service!.id, input: { published: false } },
      {
        onSuccess: (saved) => {
          setDeleteBlocked(null);
          reset({ ...getValues(), published: saved.published });
          notifySaved(`"${saved.name}" quedó oculto`);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar'),
      },
    );

  return (
    <>
      <PageHeader
        title={service ? service.name : 'Nuevo servicio'}
        description={
          service
            ? `Dirección: /servicios/${service.slug}`
            : 'Completá los textos; podés publicarlo cuando esté listo.'
        }
      />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <FormSection title="Datos principales">
          <Field label="Nombre" error={errors.name?.message}>
            {(aria) => (
              <Input
                {...aria}
                {...register('name', {
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    if (!slugEdited)
                      setValue('slug', slugify(event.target.value), { shouldDirty: true });
                  },
                })}
              />
            )}
          </Field>
          <Field
            label="Slug (dirección de la página)"
            help="Minúsculas, sin acentos ni espacios. Se usa en /servicios/<slug>."
            error={errors.slug?.message}
          >
            {(aria) => (
              <Input
                autoCapitalize="none"
                autoCorrect="off"
                {...aria}
                {...register('slug', { onChange: () => setSlugEdited(true) })}
              />
            )}
          </Field>
          <Controller
            control={control}
            name="published"
            render={({ field }) => (
              <PublishSwitch
                checked={field.value}
                onCheckedChange={field.onChange}
                itemName={service?.name ?? 'el servicio'}
              />
            )}
          />
        </FormSection>

        <FormSection title="Textos del capítulo">
          <Field
            label="Bajada"
            help="Frase corta en mayúsculas debajo del nombre."
            error={errors.tagline?.message}
          >
            {(aria) => <Input {...aria} {...register('tagline')} />}
          </Field>
          <Field
            label="Resumen"
            help="Se muestra en el índice de servicios y en Google."
            error={errors.summary?.message}
          >
            {(aria) => <Textarea rows={3} {...aria} {...register('summary')} />}
          </Field>
          <Field label="Descripción" error={errors.description?.message}>
            {(aria) => <Textarea rows={8} {...aria} {...register('description')} />}
          </Field>
        </FormSection>

        <FormSection title="Qué incluye">
          {includes.fields.length > 0 && (
            <SortableList
              label="Qué incluye"
              items={includes.fields}
              getLabel={(item) =>
                getValues(`includes.${includes.fields.findIndex((f) => f.id === item.id)}.value`) ||
                'ítem'
              }
              onReorder={(_items, { from, to }) => includes.move(from, to)}
              renderItem={(item, handle) => {
                const index = includes.fields.findIndex((f) => f.id === item.id);
                return (
                  <div className="flex items-start gap-2">
                    {handle}
                    <div className="flex-1">
                      <Input
                        aria-label={`Ítem ${index + 1}`}
                        aria-invalid={!!errors.includes?.[index]?.value}
                        {...register(`includes.${index}.value`)}
                      />
                      {errors.includes?.[index]?.value && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.includes[index].value.message}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-11"
                      aria-label={`Quitar ítem ${index + 1}`}
                      onClick={() => includes.remove(index)}
                    >
                      <X aria-hidden />
                    </Button>
                  </div>
                );
              }}
            />
          )}
          {errors.includes?.message && (
            <p className="text-sm text-destructive">{errors.includes.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            className="min-h-11 self-start"
            onClick={() => includes.append({ value: '' })}
          >
            <Plus aria-hidden /> Agregar ítem
          </Button>
        </FormSection>

        <FormSection title="Fotos">
          <Field
            label="Portada"
            help="Se ve en el índice de servicios."
            error={errors.coverImage?.message}
          >
            {(aria) => (
              <Controller
                control={control}
                name="coverImage"
                render={({ field }) => (
                  <ImagePicker
                    label="Portada"
                    value={field.value}
                    onChange={field.onChange}
                    optional
                    invalid={aria['aria-invalid']}
                    describedBy={aria['aria-describedby']}
                  />
                )}
              />
            )}
          </Field>
          <Field
            label="Galería del capítulo"
            help="Arrastrá las fotos para ordenarlas."
            error={errors.images?.message}
          >
            {(aria) => (
              <Controller
                control={control}
                name="images"
                render={({ field }) => (
                  <GalleryField
                    label="Galería del capítulo"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={aria['aria-invalid']}
                    describedBy={aria['aria-describedby']}
                  />
                )}
              />
            )}
          </Field>
        </FormSection>

        {service && (
          <FormSection title="Trabajo destacado">
            <Field
              label="Trabajo destacado"
              help={
                projects.data?.length === 0
                  ? 'Este servicio todavía no tiene trabajos cargados.'
                  : 'Se muestra en el capítulo del servicio. Solo se pueden elegir trabajos de este servicio.'
              }
              error={errors.featuredProjectId?.message}
            >
              {(aria) => (
                <Controller
                  control={control}
                  name="featuredProjectId"
                  render={({ field }) => (
                    <NativeSelect
                      {...aria}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value || null)}
                      disabled={!projects.data}
                    >
                      <option value="">Ninguno</option>
                      {projects.data?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                          {p.published ? '' : ' (no publicado)'}
                        </option>
                      ))}
                    </NativeSelect>
                  )}
                />
              )}
            </Field>
          </FormSection>
        )}

        <FormSection title="Buscadores (opcional)">
          <Field
            label="Título para Google"
            help="Si lo dejás vacío se usa el nombre."
            error={errors.seoTitle?.message}
          >
            {(aria) => <Input {...aria} {...register('seoTitle')} />}
          </Field>
          <Field
            label="Descripción para Google"
            help="Si la dejás vacía se usa el resumen."
            error={errors.seoDescription?.message}
          >
            {(aria) => <Textarea rows={3} {...aria} {...register('seoDescription')} />}
          </Field>
        </FormSection>

        <FormActions
          isSubmitting={isSubmitting}
          submitLabel={service ? 'Guardar' : 'Crear servicio'}
        >
          {service && (
            <Button
              type="button"
              variant="outline"
              className="mr-auto min-h-11 text-destructive md:min-h-9"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 aria-hidden /> Borrar
            </Button>
          )}
        </FormActions>
        {unsaved.dialog}
      </form>

      <ConfirmDialog
        open={!!pendingSlugChange}
        onOpenChange={(open) => !open && setPendingSlugChange(null)}
        title="¿Cambiar la dirección de la página?"
        description={`La página /servicios/${service?.slug ?? ''} deja de funcionar y quien la tenga guardada (o Google) llega a una página no encontrada. La nueva dirección va a ser /servicios/${pendingSlugChange?.slug ?? ''}.`}
        confirmLabel="Cambiar y guardar"
        pending={isSubmitting || update.isPending}
        onConfirm={() => {
          const values = pendingSlugChange!;
          setPendingSlugChange(null);
          void save(values);
        }}
      />
      {service && (
        <>
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title={`¿Borrar "${service.name}"?`}
            description="Se borra el servicio con sus textos. Sus fotos quedan en la biblioteca. No se puede deshacer."
            confirmLabel="Borrar servicio"
            destructive
            pending={remove.isPending}
            onConfirm={onDelete}
          />
          <ConfirmDialog
            open={!!deleteBlocked}
            onOpenChange={(open) => !open && setDeleteBlocked(null)}
            title="No se puede borrar"
            description={deleteBlocked ?? ''}
            confirmLabel="Despublicar en su lugar"
            cancelLabel="Cerrar"
            pending={update.isPending}
            onConfirm={unpublish}
          />
        </>
      )}
    </>
  );
}
