import { vi } from 'vitest';

type Reply = { status: number; body?: unknown };

/** Mock de fetch que responde según "MÉTODO /ruta", en orden, una respuesta por llamada. */
export function mockFetch(routes: Record<string, Reply[]>) {
  const calls: Array<{ key: string; init: RequestInit }> = [];
  const fn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const key = `${init.method ?? 'GET'} ${url}`;
    calls.push({ key, init });
    const reply = routes[key]?.shift();
    if (!reply) throw new Error(`Sin respuesta simulada para ${key}`);
    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fn);
  return { fn, calls };
}

export const session = (token: string) => ({
  accessToken: token,
  expiresIn: 900,
  admin: { id: '1', email: 'admin@tamila.test', createdAt: '2026-09-30T12:00:00.000Z' },
});
