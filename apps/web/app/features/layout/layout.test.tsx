import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithRouter } from '~/test/render';
import { siteContent } from '~/test/fixtures';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

describe('Navbar', () => {
  it('muestra el logo, los enlaces a secciones y el botón de WhatsApp', () => {
    renderWithRouter(<Navbar site={siteContent()} />);
    expect(screen.getByRole('link', { name: 'TAMILA, ir al inicio' })).toHaveAttribute('href', '/');
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/#servicios', '/#como-trabajamos', '/#trabajos', '/#preguntas']);
    expect(screen.getByRole('link', { name: 'Pedir presupuesto' })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/5491100000000'),
    );
  });

  it('es fija arriba y no reserva espacio en la página', () => {
    renderWithRouter(<Navbar site={siteContent()} />);
    expect(screen.getByRole('banner')).toHaveClass('fixed', 'top-0');
  });

  it('el menú móvil es un modal que se cierra al tocar el fondo', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navbar site={siteContent()} />);
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(screen.getByRole('dialog', { name: 'Menú' })).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(screen.getByTestId('menu-fondo'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('oculta el enlace a Trabajos si no hay trabajos publicados', () => {
    renderWithRouter(<Navbar site={{ ...siteContent(), hasProjects: false }} />);
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(nav).queryByRole('link', { name: 'Trabajos' })).not.toBeInTheDocument();
  });

  it('el menú móvil se abre, atrapa el foco, se cierra con Escape y al elegir un enlace', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navbar site={siteContent()} />);
    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);
    const dialog = screen.getByRole('dialog', { name: 'Menú' });
    const links = within(dialog).getAllByRole('link');
    expect(links[0]).toHaveFocus();

    await user.tab({ shift: true });
    expect(within(dialog).getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
    await user.tab();
    expect(links[0]).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: /Servicios/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('Footer', () => {
  it('muestra servicios, contacto, horario y solo las redes configuradas', () => {
    renderWithRouter(<Footer site={siteContent()} />);
    expect(screen.getByRole('link', { name: 'Durlock' })).toHaveAttribute(
      'href',
      '/servicios/durlock',
    );
    expect(screen.getByRole('link', { name: 'Escribinos por WhatsApp' })).toBeInTheDocument();
    expect(screen.getByText('Lunes a viernes de 8 a 18 h')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Facebook' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'TikTok' })).not.toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} TAMILA`)),
    ).toBeInTheDocument();
  });

  it('sin redes ni horario no muestra esos bloques', () => {
    renderWithRouter(<Footer site={siteContent({ instagramUrl: null, businessHours: null })} />);
    expect(screen.queryByRole('list', { name: 'Redes sociales' })).not.toBeInTheDocument();
  });
});
