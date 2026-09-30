import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChapterNumber, Eyebrow, PullQuote, ResponsiveImage, Rule } from '.';

const image = {
  alt: 'Tabique de durlock',
  width: 1600,
  height: 1067,
  src: '/media/a-1600.webp',
  variants: [
    { width: 480, avif: '/media/a-480.avif', webp: '/media/a-480.webp' },
    { width: 1600, avif: '/media/a-1600.avif', webp: '/media/a-1600.webp' },
  ],
};

describe('componentes editoriales', () => {
  it('ChapterNumber muestra el número con dos dígitos y el trazo decorativo oculto', () => {
    const { container } = render(<ChapterNumber value={4} />);
    expect(container).toHaveTextContent('04');
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden');
  });

  it('Eyebrow, Rule y PullQuote renderizan su contenido', () => {
    render(
      <>
        <Eyebrow>Pág. 06 · Servicios</Eyebrow>
        <Rule />
        <PullQuote cite="TAMILA">Obra limpia y a tiempo.</PullQuote>
      </>,
    );
    expect(screen.getByText('Pág. 06 · Servicios')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('Obra limpia y a tiempo.').closest('blockquote')).toBeInTheDocument();
  });

  it('ResponsiveImage arma srcset AVIF/WebP, declara dimensiones y carga diferida', () => {
    const { container } = render(<ResponsiveImage image={image} sizes="50vw" />);
    const [avif, webp] = container.querySelectorAll('source');
    expect(avif).toHaveAttribute('srcset', '/media/a-480.avif 480w, /media/a-1600.avif 1600w');
    expect(webp).toHaveAttribute('type', 'image/webp');
    const img = screen.getByRole('img', { name: 'Tabique de durlock' });
    expect(img).toHaveAttribute('width', '1600');
    expect(img).toHaveAttribute('height', '1067');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).not.toHaveAttribute('fetchpriority');
    expect(img.className).toContain('grayscale');
  });

  it('ResponsiveImage con priority se descarga de inmediato', () => {
    render(<ResponsiveImage image={image} sizes="100vw" priority grayscale={false} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(img.className).not.toContain('grayscale');
  });
});
