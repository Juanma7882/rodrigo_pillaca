import {
  projectsResponseSchema,
  serviceDetailSchema,
  servicesResponseSchema,
  siteContentSchema,
  type Project,
  type ServiceChapter,
  type ServiceDetail,
  type SiteContent,
} from '@tamila/shared';
import { data } from 'react-router';
import type { z } from 'zod';

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:3000';
const TTL_MS = 60_000;
const TIMEOUT_MS = 5_000;

type Entry = { value: unknown; expires: number };
const cache = new Map<string, Entry>();

/**
 * Lee el contenido público desde la API (solo en el servidor). Cachea 60 s en memoria y, si la
 * API falla, sirve la última versión conocida para que el sitio siga en pie.
 */
async function fetchPublic<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T>> {
  const hit = cache.get(path);
  if (hit && hit.expires > Date.now()) return hit.value as z.infer<T>;

  try {
    const res = await fetch(`${API_URL}/api/public${path}`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 404) throw data(null, { status: 404 });
    if (!res.ok) throw new Error(`La API respondió ${res.status} en ${path}`);
    const value = schema.parse(await res.json());
    cache.set(path, { value, expires: Date.now() + TTL_MS });
    return value;
  } catch (error) {
    if (error instanceof Response || (error as { status?: number }).status === 404) throw error;
    if (hit) {
      console.error(`Se sirve contenido en caché: ${(error as Error).message}`);
      return hit.value as z.infer<T>;
    }
    throw error;
  }
}

export const getSite = (): Promise<SiteContent> => fetchPublic('/site', siteContentSchema);
export const getServices = (): Promise<ServiceChapter[]> =>
  fetchPublic('/services', servicesResponseSchema);
export const getService = (slug: string): Promise<ServiceDetail> =>
  fetchPublic(`/services/${encodeURIComponent(slug)}`, serviceDetailSchema);
export const getProjects = (): Promise<Project[]> =>
  fetchPublic('/projects', projectsResponseSchema);

/** Solo para tests. */
export const clearContentCache = () => cache.clear();
