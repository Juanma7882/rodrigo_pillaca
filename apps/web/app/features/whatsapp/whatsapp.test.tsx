import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FloatingWhatsApp } from './FloatingWhatsApp';
import { buildWhatsAppUrl, serviceMessage } from './whatsapp';
import { WhatsAppButton } from './WhatsAppButton';

describe('WhatsApp', () => {
  it('arma la URL con el mensaje codificado', () => {
    expect(buildWhatsAppUrl('54 9 11 0000-0000', 'Hola, ¿cómo están?')).toBe(
      'https://wa.me/5491100000000?text=Hola%2C%20%C2%BFc%C3%B3mo%20est%C3%A1n%3F',
    );
  });

  it('el mensaje por servicio nombra el servicio', () => {
    expect(serviceMessage('Plomería')).toBe('Hola, quiero consultar por Plomería');
  });

  it('el botón abre WhatsApp en una pestaña nueva', () => {
    render(
      <WhatsAppButton number="5491100000000" message={serviceMessage('Gas')}>
        Consultar
      </WhatsAppButton>,
    );
    const link = screen.getByRole('link', { name: 'Consultar' });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('text=Hola%2C%20quiero%20consultar%20por%20Gas'),
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });

  it('sin número no se muestra ningún botón', () => {
    const { container } = render(
      <>
        <WhatsAppButton number="" message="Hola">
          Consultar
        </WhatsAppButton>
        <FloatingWhatsApp number="" message="Hola" />
      </>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('el botón flotante tiene etiqueta accesible', () => {
    render(<FloatingWhatsApp number="5491100000000" message="Hola" />);
    expect(screen.getByRole('link', { name: 'Escribinos por WhatsApp' })).toBeInTheDocument();
  });
});
