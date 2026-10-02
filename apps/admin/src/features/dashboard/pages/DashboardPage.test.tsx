import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch } from '@/test/fetch-mock';
import { mediaPage, projectFixture, serviceFixture } from '@/test/fixtures';
import { renderPage, signIn } from '@/test/render';
import { DashboardPage } from './DashboardPage';

const content = () => ({
  'GET /api/admin/services': [
    {
      status: 200,
      body: [
        serviceFixture('durlock'),
        serviceFixture('gas', { published: false }),
        serviceFixture('pintura'),
      ],
    },
  ],
  'GET /api/admin/projects': [
    { status: 200, body: [projectFixture('p1'), projectFixture('p2', { published: false })] },
  ],
  'GET /api/admin/media?page=1&pageSize=1&unused=true': [
    { status: 200, body: mediaPage([], 4, 1, 1) },
  ],
});

describe('DashboardPage', () => {
  beforeEach(() => signIn());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('resume el contenido y da acceso a cada sección', async () => {
    vi.stubEnv('VITE_PUBLIC_SITE_URL', 'https://tamila.com.ar');
    mockFetch(content());
    renderPage(<DashboardPage />);

    expect(await screen.findByText('2 de 3 publicados')).toBeInTheDocument();
    expect(await screen.findByText('1 publicado')).toBeInTheDocument();
    expect(await screen.findByText('4 sin usar')).toBeInTheDocument();
    const sections = within(screen.getByRole('list', { name: 'Secciones del panel' }));
    expect(sections.getAllByRole('link').map((l) => l.getAttribute('href'))).toEqual([
      '/servicios',
      '/trabajos',
      '/imagenes',
      '/configuracion',
      '/como-trabajamos',
      '/preguntas',
    ]);

    const site = screen.getByRole('link', { name: 'Ver el sitio' });
    expect(site).toHaveAttribute('href', 'https://tamila.com.ar');
    expect(site).toHaveAttribute('target', '_blank');
    expect(site.getAttribute('rel')).toContain('noopener');
  });

  it('sin la URL del sitio no muestra "Ver el sitio"', async () => {
    vi.stubEnv('VITE_PUBLIC_SITE_URL', '');
    mockFetch(content());
    renderPage(<DashboardPage />);
    await screen.findByText('2 de 3 publicados');
    expect(screen.queryByRole('link', { name: 'Ver el sitio' })).not.toBeInTheDocument();
  });
});
