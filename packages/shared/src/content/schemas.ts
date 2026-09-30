import { z } from 'zod';

/** Imagen con variantes responsive. Las rutas son públicas (/media/...). */
export const mediaVariantSchema = z.object({
  width: z.number().int().positive(),
  avif: z.string().startsWith('/media/'),
  webp: z.string().startsWith('/media/'),
});
export type MediaVariant = z.infer<typeof mediaVariantSchema>;

export const mediaAssetSchema = z.object({
  id: z.string(),
  alt: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Imagen de respaldo (WebP del ancho mayor). */
  src: z.string().startsWith('/media/'),
  variants: z.array(mediaVariantSchema).min(1),
  credit: z.string().nullable(),
});
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

export const serviceLinkSchema = z.object({ slug: z.string(), name: z.string() });
export type ServiceLink = z.infer<typeof serviceLinkSchema>;

export const siteSettingsSchema = z.object({
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  whatsappNumber: z.string(),
  whatsappDefaultMessage: z.string(),
  instagramUrl: z.url().nullable(),
  facebookUrl: z.url().nullable(),
  tiktokUrl: z.url().nullable(),
  businessHours: z.string().nullable(),
  footerText: z.string().nullable(),
  seoTitle: z.string(),
  seoDescription: z.string(),
  ogImage: mediaAssetSchema.nullable(),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

export const processStepSchema = z.object({
  order: z.number().int(),
  title: z.string(),
  description: z.string(),
});
export type ProcessStep = z.infer<typeof processStepSchema>;

export const faqSchema = z.object({ id: z.string(), question: z.string(), answer: z.string() });
export type Faq = z.infer<typeof faqSchema>;

/** GET /api/public/site: todo lo que necesitan navbar, footer, hero y secciones fijas. */
export const siteContentSchema = z.object({
  settings: siteSettingsSchema,
  services: z.array(serviceLinkSchema),
  processSteps: z.array(processStepSchema),
  faqs: z.array(faqSchema),
});
export type SiteContent = z.infer<typeof siteContentSchema>;

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  location: z.string().nullable(),
  description: z.string(),
  service: serviceLinkSchema,
  beforeImage: mediaAssetSchema.nullable(),
  afterImage: mediaAssetSchema.nullable(),
  images: z.array(mediaAssetSchema),
});
export type Project = z.infer<typeof projectSchema>;

/** Capítulo de un servicio tal como se muestra en el inicio. */
export const serviceChapterSchema = z.object({
  slug: z.string(),
  /** Número de capítulo calculado del orden de los publicados (1, 2, …). */
  number: z.number().int().positive(),
  name: z.string(),
  tagline: z.string(),
  summary: z.string(),
  description: z.string(),
  includes: z.array(z.string()),
  coverImage: mediaAssetSchema.nullable(),
  images: z.array(mediaAssetSchema),
  featuredProject: projectSchema.nullable(),
});
export type ServiceChapter = z.infer<typeof serviceChapterSchema>;

/** Resumen de un servicio (índice, sitemap). Es un subconjunto del capítulo. */
export const serviceSummarySchema = serviceChapterSchema.pick({
  slug: true,
  number: true,
  name: true,
  tagline: true,
  summary: true,
  coverImage: true,
});
export type ServiceSummary = z.infer<typeof serviceSummarySchema>;

/** GET /api/public/services/:slug */
export const serviceDetailSchema = serviceChapterSchema.extend({
  seoTitle: z.string(),
  seoDescription: z.string(),
  projects: z.array(projectSchema),
  previous: serviceLinkSchema.nullable(),
  next: serviceLinkSchema.nullable(),
});
export type ServiceDetail = z.infer<typeof serviceDetailSchema>;

export const servicesResponseSchema = z.array(serviceChapterSchema);
export const projectsResponseSchema = z.array(projectSchema);

/** Formatea el número de capítulo con dos dígitos: 1 → "01". */
export const chapterNumber = (n: number) => String(n).padStart(2, '0');
