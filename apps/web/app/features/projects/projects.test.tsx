import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { media, project } from '~/test/fixtures';
import { BeforeAfter } from './BeforeAfter';
import { ProjectsGallery } from './ProjectsGallery';

describe('Trabajos realizados', () => {
  it('sin trabajos la sección no se muestra', () => {
    const { container } = render(<ProjectsGallery projects={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra título, servicio, año y zona', () => {
    render(<ProjectsGallery projects={[project()]} />);
    expect(screen.getByRole('heading', { name: 'Oficina en Palermo' })).toBeInTheDocument();
    expect(screen.getByText('Durlock · 2025 · Palermo, CABA')).toBeInTheDocument();
  });

  it('el comparador antes/después se mueve con el control', () => {
    render(<BeforeAfter before={media('antes')} after={media('despues')} title="Living" />);
    const slider = screen.getByRole('slider', { name: /Comparar antes y después: Living/ });
    expect(slider).toHaveAttribute('aria-valuetext', '50% antes, 50% después');
    fireEvent.change(slider, { target: { value: '75' } });
    expect(slider).toHaveAttribute('aria-valuetext', '75% antes, 25% después');
    const clip = slider.parentElement!.querySelector<HTMLElement>('[style*="clip-path"]')!;
    expect(clip.style.clipPath).toBe('inset(0 25% 0 0)');
  });
});
