import { PageHeader } from '@/features/content';
import type { AdminMedia } from '@tamila/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@tamila/ui';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatBytes, useMediaLibrary } from '../api/media';
import { MediaDetailsDialog } from '../MediaDetailsDialog';
import { MediaThumb } from '../MediaThumb';
import { UploadQueue } from '../UploadQueue';
import { useUploadQueue } from '../useUploadQueue';

export function MediaPage() {
  const [unused, setUnused] = useState(false);
  const [selected, setSelected] = useState<AdminMedia | null>(null);
  const queue = useUploadQueue();
  const library = useMediaLibrary(unused);
  const items = library.data?.pages.flatMap((page) => page.items) ?? [];
  const total = library.data?.pages[0]?.total ?? 0;

  return (
    <>
      <PageHeader
        title="Imágenes"
        description="Subí fotos, corregí su descripción y borrá las que no se usan."
      />

      <Card className="mb-8">
        <CardContent>
          <UploadQueue queue={queue} />
        </CardContent>
      </Card>

      <Tabs
        value={unused ? 'unused' : 'all'}
        onValueChange={(value) => setUnused(value === 'unused')}
      >
        <TabsList aria-label="Filtrar imágenes">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unused">Sin usar</TabsTrigger>
        </TabsList>
      </Tabs>

      <p className="mt-4 mb-3 text-sm text-muted-foreground" aria-live="polite">
        {library.isPending
          ? 'Cargando imágenes…'
          : `${total} ${total === 1 ? 'imagen' : 'imágenes'}`}
      </p>

      {library.isError && (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar las imágenes.{' '}
          <Button variant="outline" size="sm" onClick={() => void library.refetch()}>
            Reintentar
          </Button>
        </p>
      )}

      <ul
        aria-label="Biblioteca de imágenes"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        {library.isPending &&
          Array.from({ length: 8 }, (_, i) => (
            <li key={i}>
              <Skeleton className="aspect-[4/3] w-full rounded-md" />
            </li>
          ))}
        {items.map((media) => (
          <li key={media.id}>
            <button
              type="button"
              onClick={() => setSelected(media)}
              aria-label={`Ver ${media.alt}`}
              className="flex w-full flex-col gap-1 rounded-md text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <MediaThumb image={media} />
              <span className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                {formatBytes(media.totalBytes)}
                {media.usages.length === 0 ? (
                  <Badge variant="outline">Sin usar</Badge>
                ) : (
                  <Badge variant="secondary">
                    {media.usages.length === 1 ? 'En 1 lugar' : `En ${media.usages.length} lugares`}
                  </Badge>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <LoadMore
        hasMore={!!library.hasNextPage}
        loading={library.isFetchingNextPage}
        onLoad={() => void library.fetchNextPage()}
      />

      <MediaDetailsDialog media={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/** Carga la página siguiente al llegar al final (o con el botón, si no hay IntersectionObserver). */
function LoadMore({
  hasMore,
  loading,
  onLoad,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoad: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const onLoadRef = useRef(onLoad);
  useLayoutEffect(() => {
    onLoadRef.current = onLoad;
  });

  useEffect(() => {
    if (!hasMore || loading || !sentinel.current || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) onLoadRef.current();
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  if (!hasMore) return null;
  return (
    <div ref={sentinel} className="mt-6 flex justify-center">
      <Button variant="outline" className="min-h-11" disabled={loading} onClick={onLoad}>
        {loading ? 'Cargando…' : 'Cargar más'}
      </Button>
    </div>
  );
}
