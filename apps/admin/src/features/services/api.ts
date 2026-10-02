import { apiFetch } from '@/features/auth';
import {
  adminServiceSchema,
  type AdminService,
  type ServiceCreateInput,
  type ServiceUpdateInput,
} from '@tamila/shared';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const listSchema = z.array(adminServiceSchema);
const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const serviceKeys = {
  all: ['services'] as const,
  list: ['services', 'list'] as const,
  detail: (id: string) => ['services', 'detail', id] as const,
};

export function useServices() {
  return useQuery({
    queryKey: serviceKeys.list,
    queryFn: async () => listSchema.parse(await apiFetch('/admin/services')),
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: serviceKeys.detail(id ?? ''),
    queryFn: async () => adminServiceSchema.parse(await apiFetch(`/admin/services/${id}`)),
    enabled: !!id,
  });
}

/** Un cambio en servicios afecta trabajos (servicio y destacado) e imágenes (usos). */
const invalidateAll = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: serviceKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['projects'] }),
    queryClient.invalidateQueries({ queryKey: ['media'] }),
  ]);

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ServiceCreateInput) =>
      adminServiceSchema.parse(await apiFetch('/admin/services', json('POST', input))),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ServiceUpdateInput }) =>
      adminServiceSchema.parse(await apiFetch(`/admin/services/${id}`, json('PATCH', input))),
    onSuccess: (saved) => {
      queryClient.setQueryData(serviceKeys.detail(saved.id), saved);
      queryClient.setQueryData<AdminService[]>(serviceKeys.list, (list) =>
        list?.map((s) => (s.id === saved.id ? saved : s)),
      );
      return invalidateAll(queryClient);
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/admin/services/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export const saveServiceOrder = async (ids: string[]): Promise<AdminService[]> =>
  listSchema.parse(await apiFetch('/admin/services/order', json('PUT', { ids })));
