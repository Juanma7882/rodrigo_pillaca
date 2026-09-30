/**
 * Número con dos dígitos: 1 → "01". Local para no importar @tamila/shared en el cliente
 * (arrastraría Zod y todos los esquemas al bundle).
 */
export const twoDigits = (n: number) => String(n).padStart(2, '0');
