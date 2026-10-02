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
  useUnsavedChanges,
} from '@/features/content';
import { GalleryField, ImagePicker } from '@/features/media';
import { useServices } from '@/features/services';
import {
  mediaAssetSchema,
  projectCreateSchema,
  type AdminProject,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from '@tamila/shared';
import { Button, Input, Skeleton, Textarea, toast } from '@tamila/ui';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { z } from 'zod';
import { useCreateProject, useDeleteProject, useProject, useUpdateProject } from '../api';

const fields = projectCreateSchema.shape;
/** Los mismos campos que valida la API, con las imágenes completas en lugar de sus ids. */
const formSchema = z.object({
  title: fields.title,
  year: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
    fields.year.unwrap(),
  ),
  location: fields.location,
  description: fields.description,
  serviceId: z.string().min(1, 'Elegí el servicio'),
  published: z.boolean(),
  beforeImage: mediaAssetSchema.nullable(),
  afterImage: mediaAssetSchema.nullable(),
  images: z.array(mediaAssetSchema),
});
type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

const toFormValues = (p: AdminProject): FormInput => ({
  title: p.title,
  year: p.year === null ? '' : String(p.year),
  location: p.location ?? '',
  description: p.description,
  serviceId: p.serviceId,
  published: p.published,
  beforeImage: p.beforeImage,
  afterImage: p.afterImage,
  images: p.images,
});

function toInput(values: Partial<FormOutput>): ProjectUpdateInput {
  const { beforeImage, afterImage, images, ...rest } = values;
  return {
    ...rest,
    ...(beforeImage !== undefined && { beforeImageId: beforeImage?.id ?? null }),
    ...(afterImage !== undefined && { afterImageId: afterImage?.id ?? null }),
    ...(images !== undefined && { imageIds: images.map((m) => m.id) }),
  };
}

const RENAME = {
  beforeImageId: 'beforeImage',
  afterImageId: 'afterImage',
  imageIds: 'images',
} as const;

export function ProjectFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const isNew = id === 'nuevo';
  const project = useProject(isNew ? undefined : id);

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
        <Link to="/trabajos">
          <ArrowLeft aria-hidden /> Trabajos
        </Link>
      </Button>
      {isNew ? (
        <ProjectForm defaultServiceId={params.get('servicio') ?? ''} />
      ) : project.data ? (
        <ProjectForm key={project.data.id} project={project.data} />
      ) : project.isError ? (
        <p role="alert" className="text-sm text-destructive">
          {project.error instanceof ApiError && project.error.status === 404
            ? 'Ese trabajo no existe.'
            : 'No se pudo cargar el trabajo.'}
        </p>
      ) : (
        <Skeleton className="h-96 w-full" />
      )}
    </>
  );
}

function ProjectForm({
  project,
  defaultServiceId = '',
}: {
  project?: AdminProject;
  defaultServiceId?: string;
}) {
  const navigate = useNavigate();
  const services = useServices();
  const create = useCreateProject();
  const update = useUpdateProject();
  const remove = useDeleteProject();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting, dirtyFields },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: project
      ? toFormValues(project)
      : {
          title: '',
          year: '',
          location: '',
          description: '',
          serviceId: defaultServiceId,
          published: false,
          beforeImage: null,
          afterImage: null,
          images: [],
        },
  });
  const unsaved = useUnsavedChanges(isDirty);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (!project) {
        const created = await create.mutateAsync(toInput(values) as ProjectCreateInput);
        unsaved.allowNavigation();
        toast.success(`Trabajo "${created.title}" creado`, {
          description: created.published
            ? 'El sitio se actualiza en hasta un minuto.'
            : 'Todavía no está publicado.',
        });
        navigate(`/trabajos/${created.id}`, { replace: true });
        return;
      }
      const saved = await update.mutateAsync({
        id: project.id,
        input: toInput(pickDirty(values, dirtyFields)),
      });
      reset(toFormValues(saved));
      notifySaved();
    } catch (error) {
      applyApiErrors(error, setError, { rename: RENAME });
    }
  });

  const onDelete = () =>
    remove.mutate(project!.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        unsaved.allowNavigation();
        toast.success(`Trabajo "${project!.title}" borrado`);
        navigate('/trabajos', { replace: true });
      },
      onError: (error) => {
        setConfirmDelete(false);
        toast.error(error instanceof ApiError ? error.message : 'No se pudo borrar');
      },
    });

  const imageField = (name: 'beforeImage' | 'afterImage', label: string, help: string) => (
    <Field label={label} help={help} error={errors[name]?.message}>
      {(aria) => (
        <Controller
          control={control}
          name={name}
          render={({ field }) => (
            <ImagePicker
              label={label}
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
  );

  return (
    <>
      <PageHeader
        title={project ? project.title : 'Nuevo trabajo'}
        description={project?.featured ? 'Es el trabajo destacado de su servicio.' : undefined}
      />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <FormSection title="Datos del trabajo">
          <Field label="Título" error={errors.title?.message}>
            {(aria) => <Input {...aria} {...register('title')} />}
          </Field>
          <Field label="Servicio" error={errors.serviceId?.message}>
            {(aria) => (
              // Controlado: las opciones llegan después del primer render y el valor elegido
              // (por ejemplo, el servicio del filtro) se tiene que mantener.
              <Controller
                control={control}
                name="serviceId"
                render={({ field }) => (
                  <NativeSelect
                    {...aria}
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={!services.data}
                  >
                    <option value="">Elegí un servicio</option>
                    {services.data?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </NativeSelect>
                )}
              />
            )}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Año (opcional)" error={errors.year?.message}>
              {(aria) => <Input inputMode="numeric" {...aria} {...register('year')} />}
            </Field>
            <Field
              label="Zona (opcional)"
              help="Ej.: Palermo, CABA"
              error={errors.location?.message}
            >
              {(aria) => <Input {...aria} {...register('location')} />}
            </Field>
          </div>
          <Field label="Descripción" error={errors.description?.message}>
            {(aria) => <Textarea rows={5} {...aria} {...register('description')} />}
          </Field>
          <Controller
            control={control}
            name="published"
            render={({ field }) => (
              <PublishSwitch
                checked={field.value}
                onCheckedChange={field.onChange}
                itemName={project?.title ?? 'el trabajo'}
              />
            )}
          />
        </FormSection>

        <FormSection title="Fotos">
          <div className="grid gap-4 lg:grid-cols-2">
            {imageField(
              'beforeImage',
              'Foto de antes',
              'Con antes y después, el sitio muestra un comparador.',
            )}
            {imageField('afterImage', 'Foto de después', 'Es la foto principal del trabajo.')}
          </div>
          <Field
            label="Galería"
            help="Más fotos de la obra. Arrastrá para ordenarlas."
            error={errors.images?.message}
          >
            {(aria) => (
              <Controller
                control={control}
                name="images"
                render={({ field }) => (
                  <GalleryField
                    label="Galería"
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

        <FormActions
          isSubmitting={isSubmitting}
          submitLabel={project ? 'Guardar' : 'Crear trabajo'}
        >
          {project && (
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

      {project && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`¿Borrar "${project.title}"?`}
          description={
            project.featured
              ? 'Es el trabajo destacado de su servicio: el servicio queda sin destacado. Sus fotos quedan en la biblioteca.'
              : 'Se borra el trabajo. Sus fotos quedan en la biblioteca. No se puede deshacer.'
          }
          confirmLabel="Borrar trabajo"
          destructive
          pending={remove.isPending}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
