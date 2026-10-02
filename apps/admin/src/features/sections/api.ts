import { apiFetch } from '@/features/auth';
import { adminFaqSchema, adminProcessStepSchema } from '@tamila/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

/** API de una sección simple (pasos o preguntas): lista, alta, edición, borrado y orden. */
function sectionApi<T extends { id: string }>(path: string, item: z.ZodType<T>) {
  const list = z.array(item);
  const key = [path] as const;
  const fetchList = async () => list.parse(await apiFetch(`/admin/${path}`));

  return {
    key,
    useList: () => useQuery({ queryKey: key, queryFn: fetchList }),
    saveOrder: async (ids: string[]) =>
      list.parse(await apiFetch(`/admin/${path}/order`, json('PUT', { ids }))),
    useCreate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (input: unknown) =>
          item.parse(await apiFetch(`/admin/${path}`, json('POST', input))),
        onSuccess: (created) =>
          queryClient.setQueryData<T[]>(key, (current) => [...(current ?? []), created]),
      });
    },
    useUpdate: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async ({ id, input }: { id: string; input: unknown }) =>
          item.parse(await apiFetch(`/admin/${path}/${id}`, json('PATCH', input))),
        onSuccess: (saved) =>
          queryClient.setQueryData<T[]>(key, (current) =>
            current?.map((i) => (i.id === saved.id ? saved : i)),
          ),
      });
    },
    useDelete: () => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => apiFetch<void>(`/admin/${path}/${id}`, { method: 'DELETE' }),
        // Al borrar, la API renumera el resto: se vuelve a pedir la lista.
        onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
      });
    },
  };
}

export const stepsApi = sectionApi('process-steps', adminProcessStepSchema);
export const faqsApi = sectionApi('faqs', adminFaqSchema);
