/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY: string;
  /** URL pública del sitio (link "Ver el sitio"). Opcional: sin ella el link no se muestra. */
  readonly VITE_PUBLIC_SITE_URL?: string;
}
