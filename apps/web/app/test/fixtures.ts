import type { MediaAsset, Project, ServiceChapter, SiteContent } from '@tamila/shared';

export const media = (id: string, alt = `Foto ${id}`): MediaAsset => ({
  id,
  alt,
  width: 1600,
  height: 1067,
  src: `/media/${id}-1600.webp`,
  variants: [
    { width: 480, avif: `/media/${id}-480.avif`, webp: `/media/${id}-480.webp` },
    { width: 1600, avif: `/media/${id}-1600.avif`, webp: `/media/${id}-1600.webp` },
  ],
  credit: null,
});

export const siteContent = (overrides: Partial<SiteContent['settings']> = {}): SiteContent => ({
  settings: {
    heroTitle: 'Construimos, renovamos, terminamos.',
    heroSubtitle: 'Un solo equipo para toda tu obra.',
    whatsappNumber: '5491100000000',
    whatsappDefaultMessage: 'Hola, quiero hacer una consulta.',
    instagramUrl: 'https://instagram.com/tamila',
    facebookUrl: null,
    tiktokUrl: null,
    businessHours: 'Lunes a viernes de 8 a 18 h',
    footerText: 'Construcción en seco y terminaciones.',
    seoTitle: 'TAMILA · Construcción y reformas',
    seoDescription: 'Servicios de construcción.',
    ogImage: media('og'),
    ...overrides,
  },
  services: [
    { slug: 'durlock', name: 'Durlock' },
    { slug: 'pintura', name: 'Pintura' },
  ],
  processSteps: [
    { order: 1, title: 'Contacto', description: 'Nos escribís.' },
    { order: 2, title: 'Visita y medición', description: 'Vamos a ver la obra.' },
  ],
  faqs: [{ id: 'f1', question: '¿El presupuesto tiene costo?', answer: 'No, es sin cargo.' }],
  hasProjects: true,
});

export const project = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1',
  title: 'Oficina en Palermo',
  year: 2025,
  location: 'Palermo, CABA',
  description: 'Tabiques y cielorraso.',
  service: { slug: 'durlock', name: 'Durlock' },
  beforeImage: null,
  afterImage: null,
  images: [media('p1')],
  ...overrides,
});

export const chapter = (overrides: Partial<ServiceChapter> = {}): ServiceChapter => ({
  slug: 'durlock',
  number: 1,
  name: 'Durlock',
  tagline: 'Tabiques, cielorrasos y revestimientos',
  summary: 'Construcción en seco rápida y limpia.',
  description: 'Con placas de yeso armamos tabiques.',
  includes: ['Tabiques divisorios', 'Cielorrasos'],
  coverImage: media('durlock-1'),
  images: [media('durlock-1'), media('durlock-2'), media('durlock-3')],
  featuredProject: project(),
  ...overrides,
});
