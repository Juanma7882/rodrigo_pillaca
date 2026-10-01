import type {
  AdminFaq,
  AdminProcessStep,
  AdminProject,
  AdminService,
  AdminSettings,
} from '@tamila/shared';
import type { Faq, Prisma, ProcessStep } from '../generated/prisma/client';
import { toMediaDto } from '../media/media-store';

const gallery = { include: { media: true }, orderBy: { order: 'asc' } } as const;

export const adminServiceInclude = {
  coverImage: true,
  images: gallery,
  _count: { select: { projects: true } },
} satisfies Prisma.ServiceInclude;

export const adminProjectInclude = {
  service: { select: { slug: true, name: true } },
  featuredIn: { select: { id: true } },
  beforeImage: true,
  afterImage: true,
  images: gallery,
} satisfies Prisma.ProjectInclude;

export const adminSettingsInclude = {
  heroImage: true,
  ogImage: true,
} satisfies Prisma.SiteSettingsInclude;

type ServiceRow = Prisma.ServiceGetPayload<{ include: typeof adminServiceInclude }>;
type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof adminProjectInclude }>;
type SettingsRow = Prisma.SiteSettingsGetPayload<{ include: typeof adminSettingsInclude }>;

export function toAdminSettings(row: SettingsRow): AdminSettings {
  return {
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    heroImage: toMediaDto(row.heroImage),
    whatsappNumber: row.whatsappNumber,
    whatsappDefaultMessage: row.whatsappDefaultMessage,
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    tiktokUrl: row.tiktokUrl,
    businessHours: row.businessHours,
    footerText: row.footerText,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    ogImage: toMediaDto(row.ogImage),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminService(row: ServiceRow): AdminService {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    order: row.order,
    published: row.published,
    tagline: row.tagline,
    summary: row.summary,
    description: row.description,
    includes: row.includes,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    coverImage: toMediaDto(row.coverImage),
    images: row.images.map((i) => toMediaDto(i.media)),
    featuredProjectId: row.featuredProjectId,
    projectCount: row._count.projects,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminProject(row: ProjectRow): AdminProject {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    location: row.location,
    description: row.description,
    order: row.order,
    published: row.published,
    serviceId: row.serviceId,
    service: row.service,
    featured: row.featuredIn !== null,
    beforeImage: toMediaDto(row.beforeImage),
    afterImage: toMediaDto(row.afterImage),
    images: row.images.map((i) => toMediaDto(i.media)),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const toAdminProcessStep = ({ id, order, title, description }: ProcessStep) =>
  ({ id, order, title, description }) satisfies AdminProcessStep;

export const toAdminFaq = ({ id, order, question, answer, published }: Faq) =>
  ({ id, order, question, answer, published }) satisfies AdminFaq;
