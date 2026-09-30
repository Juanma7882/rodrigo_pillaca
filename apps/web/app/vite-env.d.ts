/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Número de WhatsApp de respaldo para la página de error si la API no responde. */
  readonly VITE_WHATSAPP_FALLBACK?: string;
}
