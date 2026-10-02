import { ApiError } from '@/features/auth';
import {
  NativeSelect,
  PageHeader,
  PublishSwitch,
  SortableList,
  useReorder,
} from '@/features/content';
import { MediaThumb } from '@/features/media';
import { useServices } from '@/features/services';
import type { AdminProject } from '@tamila/shared';
import { Button, Label, Skeleton, toast } from '@tamila/ui';
import { ImageOff, Plus } from 'lucide-react';
import { useId } from 'react';
import { Link, useSearchParams } from 'react-router';
import { projectKeys, saveProjectOrder, useProjects, useUpdateProject } from '../api';

/** Foto representativa de un trabajo para la lista. */
const thumbOf = (p: AdminProject) => p.afterImage ?? p.images[0] ?? p.beforeImage;

export function ProjectsPage() {
  const filterId = useId();
  const [params, setParams] = useSearchParams();
  const serviceId = params.get('servicio') ?? undefined;
  const services = useServices();
  const projects = useProjects(serviceId);
  const reorder = useReorder<AdminProject>(projectKeys.list(), saveProjectOrder);
  const update = useUpdateProject();
  const list = projects.data ?? [];

  const togglePublished = (project: AdminProject, published: boolean) =>
    update.mutate(
      { id: project.id, input: { published } },
      {
        onSuccess: () =>
          toast.success(
            published ? `"${project.title}" está publicado` : `"${project.title}" quedó oculto`,
            {
              description: 'El sitio se actualiza en hasta un minuto.',
            },
          ),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar'),
      },
    );

  return (
    <>
      <PageHeader
        title="Trabajos"
        description="Obras realizadas: se muestran en el inicio y en la página de su servicio."
        actions={
          <Button asChild className="min-h-11">
            <Link to={serviceId ? `/trabajos/nuevo?servicio=${serviceId}` : '/trabajos/nuevo'}>
              <Plus aria-hidden /> Nuevo trabajo
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex max-w-sm flex-col gap-1.5">
        <Label htmlFor={filterId}>Servicio</Label>
        <NativeSelect
          id={filterId}
          value={serviceId ?? ''}
          onChange={(event) =>
            setParams(event.target.value ? { servicio: event.target.value } : {}, { replace: true })
          }
        >
          <option value="">Todos los servicios</option>
          {services.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
        {serviceId && (
          <p className="text-xs text-muted-foreground">
            Para cambiar el orden, elegí "Todos los servicios".
          </p>
        )}
      </div>

      {projects.isPending && <Skeleton className="h-64 w-full" />}
      {projects.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los trabajos.{' '}
          <Button variant="outline" size="sm" onClick={() => void projects.refetch()}>
            Reintentar
          </Button>
        </p>
      )}
      {projects.data && list.length === 0 && (
        <p className="text-sm text-muted-foreground">
          {serviceId
            ? 'Este servicio todavía no tiene trabajos.'
            : 'Todavía no hay trabajos cargados.'}
        </p>
      )}
      {list.length > 0 && (
        <SortableList
          label="Trabajos"
          items={list}
          // La API ordena la lista completa: con un filtro aplicado no se puede reordenar.
          disabled={!!serviceId}
          getLabel={(p) => p.title}
          onReorder={(items) => reorder.mutate(items)}
          renderItem={(project, handle) => {
            const thumb = thumbOf(project);
            return (
              <div className="flex items-center gap-2 rounded-lg border bg-background p-2 pr-3">
                {handle}
                {thumb ? (
                  <MediaThumb
                    image={thumb}
                    className="hidden w-20 shrink-0 sm:block"
                    sizes="5rem"
                  />
                ) : (
                  <div className="hidden aspect-[4/3] w-20 shrink-0 items-center justify-center rounded-md bg-muted sm:flex">
                    <ImageOff aria-hidden className="size-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    to={`/trabajos/${project.id}`}
                    className="truncate font-semibold underline-offset-4 hover:underline"
                  >
                    {project.title}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {[project.service.name, project.year, project.featured && 'Destacado']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </div>
                <PublishSwitch
                  checked={project.published}
                  itemName={project.title}
                  disabled={update.isPending && update.variables?.id === project.id}
                  onCheckedChange={(published) => togglePublished(project, published)}
                />
              </div>
            );
          }}
        />
      )}
    </>
  );
}
