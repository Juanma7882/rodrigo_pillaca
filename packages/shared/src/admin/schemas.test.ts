import { describe, expect, it } from 'vitest';
import {
  adminMediaSchema,
  adminProjectSchema,
  adminServiceSchema,
  faqCreateSchema,
  mediaListQuerySchema,
  paginated,
  projectCreateSchema,
  reorderSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  settingsUpdateSchema,
} from './schemas';

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const errorFields = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.error?.issues.map((issue) => issue.path.join('.')) ?? [];

const media = {
  id: uuid(1),
  alt: 'Tabique',
  width: 1600,
  height: 1067,
  src: '/media/abc-v2-1600.webp',
  variants: [{ width: 480, avif: '/media/abc-v2-480.avif', webp: '/media/abc-v2-480.webp' }],
  credit: null,
};

describe('settingsUpdateSchema', () => {
  it('acepta WhatsApp vacío o en formato internacional', () => {
    expect(settingsUpdateSchema.safeParse({ whatsappNumber: '' }).success).toBe(true);
    expect(settingsUpdateSchema.parse({ whatsappNumber: ' 5491122334455 ' })).toEqual({
      whatsappNumber: '5491122334455',
    });
  });

  it('rechaza WhatsApp con +, espacios o guiones', () => {
    const result = settingsUpdateSchema.safeParse({ whatsappNumber: '+54 11 2233-4455' });
    expect(errorFields(result)).toEqual(['whatsappNumber']);
  });

  it('guarda una red vacía como null y exige https', () => {
    expect(settingsUpdateSchema.parse({ instagramUrl: '' })).toEqual({ instagramUrl: null });
    expect(settingsUpdateSchema.parse({ instagramUrl: null })).toEqual({ instagramUrl: null });
    expect(errorFields(settingsUpdateSchema.safeParse({ facebookUrl: 'http://fb.com/x' }))).toEqual(
      ['facebookUrl'],
    );
    expect(errorFields(settingsUpdateSchema.safeParse({ tiktokUrl: '@tamila' }))).toEqual([
      'tiktokUrl',
    ]);
  });

  it('recorta textos y no acepta obligatorios vacíos', () => {
    expect(settingsUpdateSchema.parse({ heroTitle: '  Hola  ' })).toEqual({ heroTitle: 'Hola' });
    expect(errorFields(settingsUpdateSchema.safeParse({ heroTitle: '   ' }))).toEqual([
      'heroTitle',
    ]);
  });

  it('un PATCH vacío no agrega campos', () => {
    expect(settingsUpdateSchema.parse({})).toEqual({});
  });

  it('rechaza campos no permitidos', () => {
    expect(settingsUpdateSchema.safeParse({ id: 2 }).success).toBe(false);
  });
});

describe('servicios', () => {
  const service = {
    slug: 'piso-flotante',
    name: 'Piso flotante',
    tagline: 'Bajada',
    summary: 'Resumen',
    description: 'Texto',
    includes: ['Colocación'],
  };

  it('un servicio nuevo queda sin publicar y con galería vacía', () => {
    expect(serviceCreateSchema.parse(service)).toMatchObject({ published: false, imageIds: [] });
  });

  it('rechaza slugs con acentos, mayúsculas, espacios o guiones sueltos', () => {
    for (const slug of ['Durlock', 'pulido de piso', 'electricidád', '-gas', 'gas-']) {
      expect(errorFields(serviceCreateSchema.safeParse({ ...service, slug }))).toEqual(['slug']);
    }
  });

  it('el PATCH no aplica valores por defecto a lo que no se envía', () => {
    expect(serviceUpdateSchema.parse({ name: 'Nuevo' })).toEqual({ name: 'Nuevo' });
  });

  it('rechaza imágenes repetidas en la galería', () => {
    const result = serviceUpdateSchema.safeParse({ imageIds: [uuid(1), uuid(1)] });
    expect(errorFields(result)).toEqual(['imageIds']);
  });

  it('acepta quitar el destacado con null', () => {
    expect(serviceUpdateSchema.parse({ featuredProjectId: null })).toEqual({
      featuredProjectId: null,
    });
  });
});

describe('trabajos, preguntas y orden', () => {
  it('valida el rango del año', () => {
    const base = { title: 'Casa', description: 'Texto', serviceId: uuid(1) };
    expect(projectCreateSchema.safeParse({ ...base, year: 2025 }).success).toBe(true);
    expect(errorFields(projectCreateSchema.safeParse({ ...base, year: 1980 }))).toEqual(['year']);
    const lejano = new Date().getFullYear() + 2;
    expect(errorFields(projectCreateSchema.safeParse({ ...base, year: lejano }))).toEqual(['year']);
  });

  it('una pregunta nueva queda publicada por defecto y no puede estar vacía', () => {
    expect(faqCreateSchema.parse({ question: '¿Hola?', answer: 'Sí' }).published).toBe(true);
    expect(errorFields(faqCreateSchema.safeParse({ question: ' ', answer: 'Sí' }))).toEqual([
      'question',
    ]);
  });

  it('reorder exige ids únicos y no vacíos', () => {
    expect(reorderSchema.safeParse({ ids: [uuid(1), uuid(2)] }).success).toBe(true);
    expect(reorderSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(reorderSchema.safeParse({ ids: [uuid(1), uuid(1)] }).success).toBe(false);
    expect(reorderSchema.safeParse({ ids: ['no-es-uuid'] }).success).toBe(false);
  });

  it('el listado de imágenes convierte la query', () => {
    expect(mediaListQuerySchema.parse({ page: '2', unused: 'true' })).toEqual({
      page: 2,
      pageSize: 24,
      unused: true,
    });
    expect(mediaListQuerySchema.parse({}).unused).toBe(false);
    expect(mediaListQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false);
  });
});

describe('respuestas del admin', () => {
  const now = new Date().toISOString();

  it('valida una imagen con pesos y usos', () => {
    const result = adminMediaSchema.safeParse({
      ...media,
      createdAt: now,
      sizes: [{ width: 480, avifBytes: 9000, webpBytes: 15000 }],
      totalBytes: 24000,
      usages: [{ kind: 'serviceCover', id: uuid(2), label: 'Portada de Durlock' }],
    });
    expect(result.success).toBe(true);
    expect(
      paginated(adminMediaSchema).safeParse({ items: [], page: 1, pageSize: 24, total: 0 }).success,
    ).toBe(true);
  });

  it('rechaza un uso desconocido', () => {
    const result = adminMediaSchema.safeParse({
      ...media,
      createdAt: now,
      sizes: [],
      totalBytes: 0,
      usages: [{ kind: 'banner', id: '1', label: 'x' }],
    });
    expect(result.success).toBe(false);
  });

  it('valida servicio y trabajo del admin', () => {
    const service = {
      id: uuid(2),
      slug: 'durlock',
      name: 'Durlock',
      order: 1,
      published: false,
      tagline: 'Bajada',
      summary: 'Resumen',
      description: 'Texto',
      includes: [],
      seoTitle: null,
      seoDescription: null,
      coverImage: media,
      images: [media],
      featuredProjectId: null,
      projectCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    expect(adminServiceSchema.safeParse(service).success).toBe(true);
    const project = {
      id: uuid(3),
      title: 'Casa',
      year: null,
      location: null,
      description: 'Texto',
      order: 1,
      published: true,
      serviceId: uuid(2),
      service: { slug: 'durlock', name: 'Durlock' },
      featured: false,
      beforeImage: null,
      afterImage: media,
      images: [],
      createdAt: now,
      updatedAt: now,
    };
    expect(adminProjectSchema.safeParse(project).success).toBe(true);
    expect(adminProjectSchema.safeParse({ ...project, createdAt: 'ayer' }).success).toBe(false);
  });
});
