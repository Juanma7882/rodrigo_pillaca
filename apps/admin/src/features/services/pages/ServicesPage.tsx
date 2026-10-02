import { ApiError } from '@/features/auth';
import { PageHeader, PublishSwitch, SortableList, useReorder } from '@/features/content';
import { MediaThumb } from '@/features/media';
import { chapterNumber, type AdminService } from '@tamila/shared';
import { Badge, Button, Skeleton, toast } from '@tamila/ui';
import { ImageOff, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { saveServiceOrder, serviceKeys, useServices, useUpdateService } from '../api';

export function ServicesPage() {
  const services = useServices();
  const reorder = useReorder<AdminService>(serviceKeys.list, saveServiceOrder);
  const update = useUpdateService();
  const list = services.data ?? [];

  // Mismo cálculo que el sitio: el número sale de la posición entre los publicados.
  const chapters = new Map(
    list.filter((s) => s.published).map((s, index) => [s.id, chapterNumber(index + 1)]),
  );

  const togglePublished = (service: AdminService, published: boolean) =>
    update.mutate(
      { id: service.id, input: { published } },
      {
        onSuccess: () =>
          toast.success(
            published ? `${service.name} está publicado` : `${service.name} quedó oculto`,
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
        title="Servicios"
        description="Arrastrá desde el asa para cambiar el orden de los capítulos."
        actions={
          <Button asChild className="min-h-11">
            <Link to="/servicios/nuevo">
              <Plus aria-hidden /> Nuevo servicio
            </Link>
          </Button>
        }
      />
      {services.isPending && <Skeleton className="h-64 w-full" />}
      {services.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar los servicios.{' '}
          <Button variant="outline" size="sm" onClick={() => void services.refetch()}>
            Reintentar
          </Button>
        </p>
      )}
      {services.data && (
        <SortableList
          label="Servicios"
          items={list}
          getLabel={(s) => s.name}
          onReorder={(items) => reorder.mutate(items)}
          renderItem={(service, handle) => (
            <div className="flex items-center gap-2 rounded-lg border bg-background p-2 pr-3">
              {handle}
              {service.coverImage ? (
                <MediaThumb
                  image={service.coverImage}
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
                  to={`/servicios/${service.id}`}
                  className="truncate font-semibold underline-offset-4 hover:underline"
                >
                  {service.name}
                </Link>
                <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                  {chapters.has(service.id) && (
                    <Badge variant="secondary">Capítulo {chapters.get(service.id)}</Badge>
                  )}
                  {service.projectCount === 1 ? '1 trabajo' : `${service.projectCount} trabajos`}
                </span>
              </div>
              <PublishSwitch
                checked={service.published}
                itemName={service.name}
                disabled={update.isPending && update.variables?.id === service.id}
                onCheckedChange={(published) => togglePublished(service, published)}
              />
            </div>
          )}
        />
      )}
      {services.data && list.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no hay servicios.</p>
      )}
    </>
  );
}
