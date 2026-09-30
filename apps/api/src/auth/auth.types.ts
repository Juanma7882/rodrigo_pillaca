export type AccessTokenPayload = { sub: string; email: string };
export type AuthenticatedAdmin = { id: string; email: string };

export const REFRESH_COOKIE = 'tamila_rt';
export const REFRESH_COOKIE_PATH = '/api/auth';
