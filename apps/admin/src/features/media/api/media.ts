import { apiFetch } from '@/features/auth';
import {
  adminMediaPageSchema,
  adminMediaSchema,
  type AdminMedia,
  type MediaUpdateInput,
  type MediaUsage,
} from '@tamila/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

export const MEDIA_PAGE_SIZE = 24;
export const mediaKeys = {
  all: ['media'] as const,
  library: (unused: boolean) => ['media', 'library', { unused }] as const,
  unusedCount: ['media', 'unused-count'] as const,
};

export async function fetchMediaPage(page: number, unused: boolean, pageSize = MEDIA_PAGE_SIZE) {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (unused) query.set('unused', 'true');
  return adminMediaPageSchema.parse(await apiFetch(`/admin/media?${query}`));
}

/** Biblioteca paginada, de la más nueva a la más vieja. */
export function useMediaLibrary(unused: boolean) {
  return useInfiniteQuery({
    queryKey: mediaKeys.library(unused),
    queryFn: ({ pageParam }) => fetchMediaPage(pageParam, unused),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.pageSize < last.total ? last.page + 1 : undefined,
  });
}

/** Cantidad de imágenes que no usa ningún contenido (para el inicio del panel). */
export function useUnusedMediaCount() {
  return useQuery({
    queryKey: mediaKeys.unusedCount,
    queryFn: async () => (await fetchMediaPage(1, true, 1)).total,
  });
}

/** Busca una imagen ya cargada en la caché de la biblioteca (para mostrar miniaturas). */
export function findCachedMedia(queryClient: QueryClient, id: string): AdminMedia | undefined {
  for (const [, data] of queryClient.getQueriesData<{ pages: { items: AdminMedia[] }[] }>({
    queryKey: ['media', 'library'],
  })) {
    const found = data?.pages.flatMap((p) => p.items).find((m) => m.id === id);
    if (found) return found;
  }
  return undefined;
}

export const invalidateMedia = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: mediaKeys.all });

export function useUpdateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MediaUpdateInput }) =>
      apiFetch<unknown>(`/admin/media/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }).then((body) => adminMediaSchema.parse(body)),
    onSuccess: () => invalidateMedia(queryClient),
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/admin/media/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateMedia(queryClient),
  });
}

/** Pantalla del panel donde se edita el contenido que usa una imagen. */
export function usageLink(usage: MediaUsage): string {
  switch (usage.kind) {
    case 'hero':
    case 'og':
      return '/configuracion';
    case 'serviceCover':
    case 'serviceGallery':
      return `/servicios/${usage.id}`;
    default:
      return `/trabajos/${usage.id}`;
  }
}

/** 312 KB, 1,4 MB… */
export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('es-AR', { maximumFractionDigits: 1 })} MB`;
}
