/** Enlace a una conversación de WhatsApp con el mensaje precargado. */
export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
}

/** Mensaje precargado para consultar por un servicio. */
export const serviceMessage = (serviceName: string) => `Hola, quiero consultar por ${serviceName}`;
