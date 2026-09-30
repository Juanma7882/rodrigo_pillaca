import { describe, expect, it } from 'vitest';
import {
  chapterNumber,
  mediaAssetSchema,
  serviceDetailSchema,
  serviceSummarySchema,
  siteContentSchema,
} from './schemas';

const media = {
  id: 'm1',
  alt: 'Tabique de durlock terminado',
  width: 1600,
  height: 1067,
  src: '/media/abc-1600.webp',
  variants: [{ width: 480, avif: '/media/abc-480.avif', webp: '/media/abc-480.webp' }],
  credit: 'Foto: Autor / CC0',
};

const project = {
  id: 'p1',
  title: 'Oficina en Palermo',
  year: 2025,
  location: 'Palermo, CABA',
  description: 'Tabiques y cielorrasos.',
  service: { slug: 'durlock', name: 'Durlock' },
  beforeImage: null,
  afterImage: media,
  images: [],
};

const chapter = {
  slug: 'durlock',
  number: 1,
  name: 'Durlock',
  tagline: 'Tabiques, cielorrasos y más',
  summary: 'Construcción en seco rápida y limpia.',
  description: 'Texto largo.',
  includes: ['Tabiques', 'Cielorrasos'],
  coverImage: media,
  images: [media],
  featuredProject: project,
};

describe('esquemas de contenido público', () => {
  it('valida una imagen con variantes', () => {
    expect(mediaAssetSchema.safeParse(media).success).toBe(true);
  });

  it('rechaza rutas de imagen fuera de /media', () => {
    expect(mediaAssetSchema.safeParse({ ...media, src: 'https://otro.com/x.jpg' }).success).toBe(
      false,
    );
  });

  it('rechaza una imagen sin variantes', () => {
    expect(mediaAssetSchema.safeParse({ ...media, variants: [] }).success).toBe(false);
  });

  it('valida el contenido del sitio y acepta redes vacías', () => {
    const result = siteContentSchema.safeParse({
      settings: {
        heroTitle: 'Construimos, renovamos, terminamos.',
        heroSubtitle: 'Reformas integrales',
        whatsappNumber: '',
        whatsappDefaultMessage: 'Hola',
        instagramUrl: null,
        facebookUrl: null,
        tiktokUrl: null,
        businessHours: null,
        footerText: null,
        seoTitle: 'TAMILA',
        seoDescription: 'Servicios',
        ogImage: null,
      },
      services: [{ slug: 'durlock', name: 'Durlock' }],
      processSteps: [{ order: 1, title: 'Contacto', description: 'Nos escribís.' }],
      faqs: [{ id: 'f1', question: '¿Cobran el presupuesto?', answer: 'No.' }],
      hasProjects: false,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza una red social que no es URL', () => {
    const result = siteContentSchema.shape.settings.shape.instagramUrl.safeParse('@tamila');
    expect(result.success).toBe(false);
  });

  it('el resumen es un subconjunto del capítulo', () => {
    const summary = serviceSummarySchema.parse(chapter);
    expect(summary).not.toHaveProperty('description');
    expect(summary.name).toBe('Durlock');
  });

  it('valida el detalle con anterior/siguiente', () => {
    const result = serviceDetailSchema.safeParse({
      ...chapter,
      seoTitle: 'Durlock · TAMILA',
      seoDescription: 'Construcción en seco',
      projects: [project],
      previous: null,
      next: { slug: 'steelframe', name: 'Steelframe' },
    });
    expect(result.success).toBe(true);
  });

  it('rechaza un número de capítulo inválido', () => {
    expect(serviceSummarySchema.safeParse({ ...chapter, number: 0 }).success).toBe(false);
  });

  it('formatea el número de capítulo con dos dígitos', () => {
    expect(chapterNumber(1)).toBe('01');
    expect(chapterNumber(12)).toBe('12');
  });
});
