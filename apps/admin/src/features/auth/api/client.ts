import {
  authResponseSchema,
  configureZodEs,
  TURNSTILE_HEADER,
  type AuthResponse,
  type LoginInput,
} from '@tamila/shared';
import { useSessionStore } from '../store';

// Mensajes de validación de Zod en español (se configura al cargar el feature, fuera del bundle inicial).
configureZodEs();

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const NETWORK_ERROR = 'No pudimos conectarnos con el servidor. Revisá tu conexión.';

async function send(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(`/api${path}`, { credentials: 'same-origin', ...init });
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    errors?: Array<{ field: string; message: string }>;
  };
  return new ApiError(response.status, body.message ?? 'Ocurrió un error inesperado', body.errors);
}

async function readSession(response: Response): Promise<AuthResponse> {
  if (!response.ok) throw await toApiError(response);
  const session = authResponseSchema.parse(await response.json());
  useSessionStore.getState().setSession(session.accessToken, session.admin);
  return session;
}

export async function login(input: LoginInput, turnstileToken: string): Promise<AuthResponse> {
  const response = await send('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [TURNSTILE_HEADER]: turnstileToken },
    body: JSON.stringify(input),
  });
  return readSession(response);
}

let refreshing: Promise<AuthResponse> | null = null;

/** Renueva la sesión con la cookie del refresh token. Una sola request aunque la pidan varios. */
export function refreshSession(): Promise<AuthResponse> {
  refreshing ??= send('/auth/refresh', { method: 'POST' })
    .then(readSession)
    .catch((error: unknown) => {
      useSessionStore.getState().clearSession();
      throw error;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

export async function logout(): Promise<void> {
  try {
    await send('/auth/logout', { method: 'POST' });
  } finally {
    useSessionStore.getState().clearSession();
  }
}

/** Fetch autenticado: agrega el access token y, ante un 401, renueva la sesión y reintenta una vez. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const withToken = (token: string | null): RequestInit => ({
    ...init,
    headers: { ...init.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });

  let response = await send(path, withToken(useSessionStore.getState().accessToken));
  if (response.status === 401) {
    const session = await refreshSession();
    response = await send(path, withToken(session.accessToken));
  }
  if (!response.ok) throw await toApiError(response);
  return (response.status === 204 ? undefined : await response.json()) as T;
}
