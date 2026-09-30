import { buttonVariants, cn } from '@tamila/ui';
import type { ReactNode } from 'react';
import { buildWhatsAppUrl } from './whatsapp';
import { WhatsAppIcon } from './WhatsAppIcon';

type WhatsAppButtonProps = {
  number: string;
  message: string;
  children: ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
};

/** Botón que abre WhatsApp con el mensaje precargado. Sin número configurado no se muestra. */
export function WhatsAppButton({
  number,
  message,
  children,
  variant = 'default',
  size = 'default',
  className,
}: WhatsAppButtonProps) {
  if (!number) return null;
  return (
    <a
      href={buildWhatsAppUrl(number, message)}
      target="_blank"
      rel="noopener"
      className={cn(
        buttonVariants({ variant, size }),
        'h-auto min-h-9 max-w-full rounded-none py-2 text-left font-semibold whitespace-normal',
        className,
      )}
    >
      <WhatsAppIcon className="size-4" />
      {children}
    </a>
  );
}
