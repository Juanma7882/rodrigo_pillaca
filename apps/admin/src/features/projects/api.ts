import { apiFetch } from '@/features/auth';
import {
  adminProjectSchema,
  type AdminProject,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from '@tamila/shared';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const listSchema = z.array(adminProjectSchema);
const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const projectKeys = {
  all: ['projects'] as const,
  list: (serviceId?: string) => ['projects', 'list', serviceId ?? 'todos'] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
};

/** Trabajos en orden; con `serviceId`, solo los de ese servicio. */
export function useProjects(serviceId?: string, { enabled = true } = {}) {
  return useQuery({
    queryKey: projectKeys.list(serviceId),
    queryFn: async () =>
      listSchema.parse(
        await apiFetch(
          `/admin/projects${serviceId ? `?serviceId=${encodeURIComponent(serviceId)}` : ''}`,
        ),
      ),
    enabled,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ''),
    queryFn: async () => adminProjectSchema.parse(await apiFetch(`/admin/projects/${id}`)),
    enabled: !!id,
  });
}

/** Un cambio en trabajos afecta servicios (destacado, cantidad) e imágenes (usos). */
const invalidateAll = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['services'] }),
    queryClient.invalidateQueries({ queryKey: ['media'] }),
  ]);

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectCreateInput) =>
      adminProjectSchema.parse(await apiFetch('/admin/projects', json('POST', input))),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ProjectUpdateInput }) =>
      adminProjectSchema.parse(await apiFetch(`/admin/projects/${id}`, json('PATCH', input))),
    onSuccess: (saved) => {
      queryClient.setQueryData(projectKeys.detail(saved.id), saved);
      return invalidateAll(queryClient);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/admin/projects/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export const saveProjectOrder = async (ids: string[]): Promise<AdminProject[]> =>
  listSchema.parse(await apiFetch('/admin/projects/order', json('PUT', { ids })));
