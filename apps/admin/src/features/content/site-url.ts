/** URL pública del sitio para "Ver el sitio". Sin VITE_PUBLIC_SITE_URL, el link no se muestra. */
export const getSiteUrl = (): string | null => import.meta.env.VITE_PUBLIC_SITE_URL || null;
