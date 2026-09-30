import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { media, siteContent } from '~/test/fixtures';
import { renderWithRouter } from '~/test/render';
import { Hero } from './Hero';

describe('Hero', () => {
  it('con foto de fondo la carga con prioridad y usa los tokens oscuros', () => {
    const settings = { ...siteContent().settings, heroImage: media('casa', 'Casa moderna') };
    renderWithRouter(<Hero settings={settings} />);
    const img = screen.getByRole('img', { name: 'Casa moderna' });
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
    expect(screen.getByRole('region', { name: settings.heroTitle })).toHaveClass('dark');
  });

  it('sin foto no renderiza imagen y usa el tema de la página', () => {
    renderWithRouter(<Hero settings={{ ...siteContent().settings, heroImage: null }} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /Construimos/ })).not.toHaveClass('dark');
  });
});
