import { ApiError } from '@/features/auth';
import { toast } from '@tamila/ui';
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * Guarda un nuevo orden con actualización optimista: la lista cambia al instante, se envían los
 * ids y, si la API rechaza el orden, vuelve al anterior con un aviso. Los reordenamientos de una
 * misma lista se encolan (scope) para que lleguen a la API en el orden en que se hicieron.
 */
export function useReorder<T extends { id: string }>(
  queryKey: QueryKey,
  save: (ids: string[]) => Promise<T[]>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    scope: { id: `reorder:${JSON.stringify(queryKey)}` },
    mutationFn: (items: T[]) => save(items.map((item) => item.id)),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T[]>(queryKey);
      queryClient.setQueryData(queryKey, items);
      return { previous };
    },
    onError: (error, _items, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('No se pudo guardar el nuevo orden', {
        description: error instanceof ApiError ? error.message : undefined,
      });
    },
    onSuccess: (saved) => queryClient.setQueryData(queryKey, saved),
  });
}
