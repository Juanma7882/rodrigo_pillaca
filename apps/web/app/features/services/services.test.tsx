import { act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { chapter } from '~/test/fixtures';
import { renderWithRouter } from '~/test/render';
import { ServiceChapter } from './ServiceChapter';
import { ServicesIndex } from './ServicesIndex';

const services = [
  chapter({ slug: 'durlock', number: 1, name: 'Durlock' }),
  chapter({ slug: 'steelframe', number: 2, name: 'Steelframe' }),
  chapter({ slug: 'pintura', number: 3, name: 'Pintura' }),
];

const caption = () => screen.getByRole('figure').querySelector('figcaption')!.textContent;

function mockReducedMotion(reduce: boolean) {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('reduced-motion') ? reduce : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

describe('ServicesIndex', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    mockReducedMotion(false);
  });

  it('lista los servicios numerados con enlaces a su capítulo', () => {
    mockReducedMotion(false);
    renderWithRouter(<ServicesIndex services={services} />);
    expect(screen.getByRole('heading', { name: 'Contenido' })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /02\s*Steelframe/ });
    expect(link).toHaveAttribute('href', '#servicio-steelframe');
  });

  it('la portada rota sola cada 4 segundos', () => {
    mockReducedMotion(false);
    renderWithRouter(<ServicesIndex services={services} />);
    expect(caption()).toContain('Durlock');
    act(() => vi.advanceTimersByTime(4000));
    expect(caption()).toContain('Steelframe');
    act(() => vi.advanceTimersByTime(4000));
    expect(caption()).toContain('Pintura');
  });

  it('al pasar el mouse por un servicio muestra su portada y pausa la rotación', () => {
    mockReducedMotion(false);
    renderWithRouter(<ServicesIndex services={services} />);
    const list = screen.getByRole('list');
    fireEvent.mouseEnter(list);
    fireEvent.mouseEnter(within(list).getByRole('link', { name: /Pintura/ }));
    expect(caption()).toContain('Pintura');
    act(() => vi.advanceTimersByTime(12000));
    expect(caption()).toContain('Pintura');
    fireEvent.mouseLeave(list);
    act(() => vi.advanceTimersByTime(4000));
    expect(caption()).toContain('Durlock');
  });

  it('con movimiento reducido no rota sola pero responde al foco', () => {
    mockReducedMotion(true);
    renderWithRouter(<ServicesIndex services={services} />);
    act(() => vi.advanceTimersByTime(12000));
    expect(caption()).toContain('Durlock');
    fireEvent.focus(screen.getByRole('link', { name: /Steelframe/ }));
    expect(caption()).toContain('Steelframe');
  });
});

describe('ServiceChapter', () => {
  it('muestra número, título, bajada, incluye, trabajo destacado y CTA de WhatsApp del servicio', () => {
    renderWithRouter(<ServiceChapter service={services[0]!} whatsappNumber="5491100000000" />);
    const article = screen.getByRole('article', { name: 'Durlock' });
    expect(article).toHaveAttribute('id', 'servicio-durlock');
    expect(within(article).getByText('01')).toBeInTheDocument();
    expect(within(article).getByRole('heading', { level: 2, name: 'Durlock' })).toBeInTheDocument();
    expect(within(article).getByText('Tabiques divisorios')).toBeInTheDocument();
    expect(within(article).getByText(/Proyecto: Oficina en Palermo/)).toBeInTheDocument();
    expect(within(article).getByRole('link', { name: /Consultar por Durlock/ })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent('Hola, quiero consultar por Durlock')),
    );
    expect(within(article).getByRole('link', { name: /Ver servicio completo/ })).toHaveAttribute(
      'href',
      '/servicios/durlock',
    );
  });

  it('sin trabajo destacado se muestra completo sin ese bloque', () => {
    renderWithRouter(
      <ServiceChapter service={chapter({ featuredProject: null })} whatsappNumber="" />,
    );
    expect(screen.queryByText(/Proyecto:/)).not.toBeInTheDocument();
    expect(screen.getByText('Con placas de yeso armamos tabiques.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Consultar/ })).not.toBeInTheDocument();
  });

  it('en su página propia el título es h1 y no se enlaza a sí mismo', () => {
    renderWithRouter(<ServiceChapter service={services[1]!} whatsappNumber="1" standalone />);
    expect(screen.getByRole('heading', { level: 1, name: 'Steelframe' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver servicio completo/ })).not.toBeInTheDocument();
  });
});
