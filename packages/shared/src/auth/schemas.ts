import { z } from 'zod';

// strictObject: la API rechaza campos no permitidos.
export const loginSchema = z.strictObject({
  email: z
    .string({ error: 'El email es obligatorio' })
    .trim()
    .toLowerCase()
    .min(1, 'El email es obligatorio')
    .pipe(z.email({ error: 'Ingresá un email válido' })),
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria')
    .max(128, 'La contraseña es demasiado larga'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const adminProfileSchema = z.object({
  id: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
});
export type AdminProfile = z.infer<typeof adminProfileSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  admin: adminProfileSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

/** Header donde el frontend envía el token de Cloudflare Turnstile. */
export const TURNSTILE_HEADER = 'cf-turnstile-response';
