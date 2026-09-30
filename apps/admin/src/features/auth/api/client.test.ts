import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, session } from '@/test/fetch-mock';
import { useSessionStore } from '../store';
import { apiFetch, ApiError, login, refreshSession } from './client';

describe('cliente de la API del admin', () => {
  beforeEach(() => useSessionStore.setState({ status: 'unknown', accessToken: null, admin: null }));
  afterEach(() => vi.unstubAllGlobals());

  it('login envía el token de Turnstile y guarda la sesión en memoria', async () => {
    const { calls } = mockFetch({ 'POST /api/auth/login': [{ status: 200, body: session('A') }] });
    await login({ email: 'admin@tamila.test', password: 'x' }, 'turnstile-ok');

    expect(new Headers(calls[0]!.init.headers).get('cf-turnstile-response')).toBe('turnstile-ok');
    expect(useSessionStore.getState()).toMatchObject({ status: 'authenticated', accessToken: 'A' });
    expect(localStorage.length).toBe(0);
  });

  it('ante un 401 renueva la sesión y reintenta una vez con el nuevo token', async () => {
    useSessionStore.getState().setSession('VENCIDO', session('x').admin);
    const { calls } = mockFetch({
      'GET /api/datos': [
        { status: 401, body: { message: 'La sesión venció' } },
        { status: 200, body: { ok: true } },
      ],
      'POST /api/auth/refresh': [{ status: 200, body: session('NUEVO') }],
    });

    await expect(apiFetch('/datos')).resolves.toEqual({ ok: true });
    expect(new Headers(calls[0]!.init.headers).get('Authorization')).toBe('Bearer VENCIDO');
    expect(new Headers(calls[2]!.init.headers).get('Authorization')).toBe('Bearer NUEVO');
  });

  it('si el refresh falla, cierra la sesión', async () => {
    useSessionStore.getState().setSession('VENCIDO', session('x').admin);
    mockFetch({
      'GET /api/datos': [{ status: 401, body: {} }],
      'POST /api/auth/refresh': [{ status: 401, body: { message: 'Sesión inválida o vencida' } }],
    });

    await expect(apiFetch('/datos')).rejects.toBeInstanceOf(ApiError);
    expect(useSessionStore.getState()).toMatchObject({ status: 'anonymous', accessToken: null });
  });

  it('varias renovaciones simultáneas hacen una sola request', async () => {
    const { calls } = mockFetch({
      'POST /api/auth/refresh': [{ status: 200, body: session('B') }],
    });
    await Promise.all([refreshSession(), refreshSession()]);
    expect(calls).toHaveLength(1);
  });
});
