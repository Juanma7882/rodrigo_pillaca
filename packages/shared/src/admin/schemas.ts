import { z } from 'zod';
import { mediaAssetSchema, serviceLinkSchema, siteSettingsSchema } from '../content/schemas';

// ─── Bloques comunes ────────────────────────────────────────────────────────
// Los esquemas de edición NO llevan .default(): con .partial() Zod 4 aplicaría el valor por
// defecto a los campos omitidos y un PATCH los pisaría.

/** Texto obligatorio: se recorta y no puede quedar vacío. */
const text = (max: number) =>
  z
    .string({ error: 'Este campo es obligatorio' })
    .trim()
    .min(1, 'Este campo es obligatorio')
    .max(max, `Máximo ${max} caracteres`);

/** Texto opcional: vacío o null se guardan como null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .transform((value) => value || null)
    .nullable();

const id = z.uuid({ error: 'Identificador inválido' });
const nullableId = id.nullable();

const httpsUrl = z.url({ protocol: /^https$/, hostname: z.regexes.domain });
const isHttpsUrl = (value: string) => httpsUrl.safeParse(value).success;

/** Red social: URL https o vacío (se guarda como null). */
const socialUrl = z
  .string()
  .trim()
  .max(300, 'Máximo 300 caracteres')
  .refine((value) => value === '' || isHttpsUrl(value), 'Ingresá un link que empiece con https://')
  .transform((value) => value || null)
  .nullable();

const uniqueIds = (max: number) =>
  z
    .array(id)
    .max(max, `Máximo ${max} elementos`)
    .refine((ids) => new Set(ids).size === ids.length, 'Hay elementos repetidos');

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const slugSchema = text(60).regex(
  SLUG_PATTERN,
  'Solo minúsculas sin acentos, números y guiones (ej. piso-flotante)',
);

/** WhatsApp en formato internacional, solo dígitos y sin "+". Vacío oculta los botones. */
export const whatsappNumberSchema = z
  .string()
  .trim()
  .regex(
    /^(\d{8,15})?$/,
    'Solo números en formato internacional, sin + ni espacios (ej. 5491122334455)',
  );

// ─── Entradas ───────────────────────────────────────────────────────────────

export const settingsUpdateSchema = z
  .strictObject({
    heroTitle: text(120),
    heroSubtitle: text(300),
    heroImageId: nullableId,
    whatsappNumber: whatsappNumberSchema,
    whatsappDefaultMessage: text(300),
    instagramUrl: socialUrl,
    facebookUrl: socialUrl,
    tiktokUrl: socialUrl,
    businessHours: optionalText(120),
    footerText: optionalText(300),
    seoTitle: text(120),
    seoDescription: text(300),
    ogImageId: nullableId,
  })
  .partial();
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

const serviceFields = z.strictObject({
  slug: slugSchema,
  name: text(80),
  tagline: text(160),
  summary: text(300),
  description: text(5000),
  includes: z.array(text(160)).max(30, 'Máximo 30 elementos'),
  seoTitle: optionalText(120),
  seoDescription: optionalText(300),
  published: z.boolean(),
  coverImageId: nullableId,
  /** Galería del capítulo: se reemplaza completa, en este orden. */
  imageIds: uniqueIds(30),
});

/** Un servicio nuevo queda sin publicar salvo que se indique lo contrario. */
export const serviceCreateSchema = serviceFields.extend({
  published: z.boolean().default(false),
  seoTitle: optionalText(120).optional(),
  seoDescription: optionalText(300).optional(),
  coverImageId: nullableId.optional(),
  imageIds: uniqueIds(30).default([]),
});
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;

/** El trabajo destacado solo se asigna al editar: tiene que ser un trabajo del servicio. */
export const serviceUpdateSchema = serviceFields
  .extend({ featuredProjectId: nullableId })
  .partial();
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;

const projectFields = z.strictObject({
  title: text(120),
  year: z
    .number({ error: 'Ingresá un año' })
    .int('Ingresá un año')
    .min(1990, 'El año no puede ser anterior a 1990')
    .refine((year) => year <= new Date().getFullYear() + 1, 'El año es demasiado lejano')
    .nullable(),
  location: optionalText(120),
  description: text(5000),
  serviceId: id,
  published: z.boolean(),
  beforeImageId: nullableId,
  afterImageId: nullableId,
  imageIds: uniqueIds(30),
});

export const projectCreateSchema = projectFields.extend({
  year: projectFields.shape.year.optional(),
  location: optionalText(120).optional(),
  published: z.boolean().default(false),
  beforeImageId: nullableId.optional(),
  afterImageId: nullableId.optional(),
  imageIds: uniqueIds(30).default([]),
});
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;

export const projectUpdateSchema = projectFields.partial();
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;

export const projectListQuerySchema = z.strictObject({ serviceId: id.optional() });

const processStepFields = z.strictObject({ title: text(80), description: text(1000) });
export const processStepCreateSchema = processStepFields;
export type ProcessStepCreateInput = z.infer<typeof processStepCreateSchema>;
export const processStepUpdateSchema = processStepFields.partial();
export type ProcessStepUpdateInput = z.infer<typeof processStepUpdateSchema>;

const faqFields = z.strictObject({
  question: text(200),
  answer: text(2000),
  published: z.boolean(),
});
export const faqCreateSchema = faqFields.extend({ published: z.boolean().default(true) });
export type FaqCreateInput = z.infer<typeof faqCreateSchema>;
export const faqUpdateSchema = faqFields.partial();
export type FaqUpdateInput = z.infer<typeof faqUpdateSchema>;

/** Lista completa de ids en el orden deseado. */
export const reorderSchema = z.strictObject({ ids: uniqueIds(500).min(1, 'La lista está vacía') });
export type ReorderInput = z.infer<typeof reorderSchema>;

/** Campos de texto que acompañan al archivo en la subida (multipart). */
export const mediaUploadSchema = z.strictObject({
  alt: text(200),
  credit: optionalText(200).optional(),
});
export type MediaUploadInput = z.infer<typeof mediaUploadSchema>;

export const mediaUpdateSchema = z
  .strictObject({ alt: text(200), credit: optionalText(200) })
  .partial();
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;

export const mediaListQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  unused: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;

// ─── Respuestas ─────────────────────────────────────────────────────────────

const timestamp = z.iso.datetime();

export const adminSettingsSchema = siteSettingsSchema.extend({ updatedAt: timestamp });
export type AdminSettings = z.infer<typeof adminSettingsSchema>;

export const adminServiceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  order: z.number().int(),
  published: z.boolean(),
  tagline: z.string(),
  summary: z.string(),
  description: z.string(),
  includes: z.array(z.string()),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  coverImage: mediaAssetSchema.nullable(),
  images: z.array(mediaAssetSchema),
  featuredProjectId: z.string().nullable(),
  projectCount: z.number().int().min(0),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type AdminService = z.infer<typeof adminServiceSchema>;

export const adminProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  location: z.string().nullable(),
  description: z.string(),
  order: z.number().int(),
  published: z.boolean(),
  serviceId: z.string(),
  service: serviceLinkSchema,
  /** Si es el trabajo destacado de su servicio. */
  featured: z.boolean(),
  beforeImage: mediaAssetSchema.nullable(),
  afterImage: mediaAssetSchema.nullable(),
  images: z.array(mediaAssetSchema),
  createdAt: timestamp,
  updatedAt: timestamp,
});
export type AdminProject = z.infer<typeof adminProjectSchema>;

export const adminProcessStepSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  title: z.string(),
  description: z.string(),
});
export type AdminProcessStep = z.infer<typeof adminProcessStepSchema>;

export const adminFaqSchema = z.object({
  id: z.string(),
  order: z.number().int(),
  question: z.string(),
  answer: z.string(),
  published: z.boolean(),
});
export type AdminFaq = z.infer<typeof adminFaqSchema>;

export const MEDIA_USAGE_KINDS = [
  'hero',
  'og',
  'serviceCover',
  'serviceGallery',
  'projectBefore',
  'projectAfter',
  'projectGallery',
] as const;

export const mediaUsageSchema = z.object({
  kind: z.enum(MEDIA_USAGE_KINDS),
  /** Id del contenido que la usa (servicio o trabajo; 1 para la configuración). */
  id: z.string(),
  /** Descripción legible, ej. "Portada de Durlock". */
  label: z.string(),
});
export type MediaUsage = z.infer<typeof mediaUsageSchema>;

export const mediaSizeSchema = z.object({
  width: z.number().int().positive(),
  avifBytes: z.number().int().min(0),
  webpBytes: z.number().int().min(0),
});
export type MediaSize = z.infer<typeof mediaSizeSchema>;

export const adminMediaSchema = mediaAssetSchema.extend({
  createdAt: timestamp,
  /** Peso de cada variante (0 si la imagen se procesó antes de registrarse los pesos). */
  sizes: z.array(mediaSizeSchema),
  totalBytes: z.number().int().min(0),
  usages: z.array(mediaUsageSchema),
});
export type AdminMedia = z.infer<typeof adminMediaSchema>;

export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
  });
export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };

export const adminMediaPageSchema = paginated(adminMediaSchema);
