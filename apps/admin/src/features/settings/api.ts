import { apiFetch } from '@/features/auth';
import { adminSettingsSchema, type AdminSettings, type SettingsUpdateInput } from '@tamila/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const settingsKey = ['settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: async () => adminSettingsSchema.parse(await apiFetch('/admin/settings')),
  });
}

export function useSaveSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SettingsUpdateInput): Promise<AdminSettings> =>
      adminSettingsSchema.parse(
        await apiFetch('/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        }),
      ),
    onSuccess: (saved) => {
      queryClient.setQueryData(settingsKey, saved);
      // Cambian los usos de las imágenes del hero y de redes.
      void queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}
