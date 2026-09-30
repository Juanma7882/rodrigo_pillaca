import { buildWhatsAppUrl } from './whatsapp';
import { WhatsAppIcon } from './WhatsAppIcon';

/** Botón flotante de WhatsApp, visible en todas las páginas. */
export function FloatingWhatsApp({ number, message }: { number: string; message: string }) {
  if (!number) return null;
  return (
    <a
      href={buildWhatsAppUrl(number, message)}
      target="_blank"
      rel="noopener"
      aria-label="Escribinos por WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-offset-background transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none sm:right-6 sm:bottom-6"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
