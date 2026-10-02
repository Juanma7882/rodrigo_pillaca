import type {
  AdminFaq,
  AdminMedia,
  AdminProcessStep,
  AdminProject,
  AdminService,
  AdminSettings,
  MediaUsage,
} from '@tamila/shared';

const NOW = '2026-10-02T12:00:00.000Z';

export function mediaFixture(id: string, overrides: Partial<AdminMedia> = {}): AdminMedia {
  return {
    id,
    alt: `Foto ${id}`,
    width: 1600,
    height: 1067,
    src: `/media/${id}-v2-1600.webp`,
    variants: [{ width: 480, avif: `/media/${id}-v2-480.avif`, webp: `/media/${id}-v2-480.webp` }],
    credit: null,
    createdAt: NOW,
    sizes: [{ width: 480, avifBytes: 20_000, webpBytes: 30_000 }],
    totalBytes: 50_000,
    usages: [],
    ...overrides,
  };
}

export const usage = (kind: MediaUsage['kind'], id: string, label: string): MediaUsage => ({
  kind,
  id,
  label,
});

export const mediaPage = (items: AdminMedia[], total = items.length, page = 1, pageSize = 24) => ({
  items,
  page,
  pageSize,
  total,
});

export function serviceFixture(id: string, overrides: Partial<AdminService> = {}): AdminService {
  return {
    id,
    slug: id,
    name: id[0]!.toUpperCase() + id.slice(1),
    order: 1,
    published: true,
    tagline: 'Bajada',
    summary: 'Resumen',
    description: 'Descripción',
    includes: ['Algo'],
    seoTitle: null,
    seoDescription: null,
    coverImage: null,
    images: [],
    featuredProjectId: null,
    projectCount: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function projectFixture(id: string, overrides: Partial<AdminProject> = {}): AdminProject {
  return {
    id,
    title: `Trabajo ${id}`,
    year: 2025,
    location: 'Palermo, CABA',
    description: 'Descripción',
    order: 1,
    published: true,
    serviceId: 'durlock',
    service: { slug: 'durlock', name: 'Durlock' },
    featured: false,
    beforeImage: null,
    afterImage: null,
    images: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export const stepFixture = (
  id: string,
  order: number,
  title = `Paso ${order}`,
): AdminProcessStep => ({
  id,
  order,
  title,
  description: `Descripción de ${title}`,
});

export const faqFixture = (
  id: string,
  order: number,
  question = `¿Pregunta ${order}?`,
  published = true,
): AdminFaq => ({ id, order, question, answer: `Respuesta ${order}`, published });

export function settingsFixture(overrides: Partial<AdminSettings> = {}): AdminSettings {
  return {
    heroTitle: 'Construimos, renovamos, terminamos.',
    heroSubtitle: 'Reformas integrales',
    heroImage: null,
    whatsappNumber: '5491100000000',
    whatsappDefaultMessage: 'Hola',
    instagramUrl: null,
    facebookUrl: null,
    tiktokUrl: null,
    businessHours: null,
    footerText: null,
    seoTitle: 'TAMILA',
    seoDescription: 'Servicios',
    ogImage: null,
    updatedAt: NOW,
    ...overrides,
  };
}
