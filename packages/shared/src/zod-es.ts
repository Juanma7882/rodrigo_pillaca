import { z } from 'zod';

/** Mensajes de error por defecto de Zod en español. Llamar una vez al iniciar cada app. */
export function configureZodEs(): void {
  z.config(z.locales.es());
}
