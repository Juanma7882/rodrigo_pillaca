import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Project as ProjectDto,
  ServiceChapter,
  ServiceDetail,
  SiteContent,
} from '@tamila/shared';
import type { Prisma } from '../generated/prisma/client';
import { toMediaDto } from '../media/media-store';
import { PrismaService } from '../prisma/prisma.service';

const projectInclude = {
  service: { select: { slug: true, name: true } },
  beforeImage: true,
  afterImage: true,
  images: { include: { media: true }, orderBy: { order: 'asc' } },
} satisfies Prisma.ProjectInclude;

const serviceInclude = {
  coverImage: true,
  images: { include: { media: true }, orderBy: { order: 'asc' } },
  featuredProject: { include: projectInclude },
} satisfies Prisma.ServiceInclude;

type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;
type ServiceRow = Prisma.ServiceGetPayload<{ include: typeof serviceInclude }>;

@Injectable()
export class PublicContentService {
  constructor(private readonly prisma: PrismaService) {}

  async site(): Promise<SiteContent> {
    const [settings, services, processSteps, faqs, projectCount] = await Promise.all([
      this.prisma.siteSettings.findUnique({
        where: { id: 1 },
        include: { ogImage: true, heroImage: true },
      }),
      this.prisma.service.findMany({
        where: { published: true },
        orderBy: { order: 'asc' },
        select: { slug: true, name: true },
      }),
      this.prisma.processStep.findMany({ orderBy: { order: 'asc' } }),
      this.prisma.faq.findMany({ where: { published: true }, orderBy: { order: 'asc' } }),
      this.prisma.project.count({ where: { published: true, service: { published: true } } }),
    ]);
    if (!settings) throw new NotFoundException('El contenido del sitio todavía no fue cargado');

    const {
      ogImage,
      heroImage,
      id: _id,
      ogImageId: _og,
      heroImageId: _hero,
      updatedAt: _u,
      ...rest
    } = settings;
    return {
      settings: { ...rest, heroImage: toMediaDto(heroImage), ogImage: toMediaDto(ogImage) },
      services,
      processSteps: processSteps.map(({ order, title, description }) => ({
        order,
        title,
        description,
      })),
      faqs: faqs.map(({ id, question, answer }) => ({ id, question, answer })),
      hasProjects: projectCount > 0,
    };
  }

  async services(): Promise<ServiceChapter[]> {
    const rows = await this.publishedServices();
    return rows.map((row, index) => this.toChapter(row, index + 1));
  }

  async service(slug: string): Promise<ServiceDetail> {
    const rows = await this.publishedServices();
    const index = rows.findIndex((row) => row.slug === slug);
    const row = rows[index];
    if (!row) throw new NotFoundException('Servicio no encontrado');

    const projects = await this.prisma.project.findMany({
      where: { serviceId: row.id, published: true },
      orderBy: { order: 'asc' },
      include: projectInclude,
    });
    const link = (r?: ServiceRow) => (r ? { slug: r.slug, name: r.name } : null);
    return {
      ...this.toChapter(row, index + 1),
      seoTitle: row.seoTitle ?? `${row.name} · TAMILA`,
      seoDescription: row.seoDescription ?? row.summary,
      projects: projects.map((p) => this.toProject(p)),
      previous: link(rows[index - 1]),
      next: link(rows[index + 1]),
    };
  }

  async projects(): Promise<ProjectDto[]> {
    const rows = await this.prisma.project.findMany({
      where: { published: true, service: { published: true } },
      orderBy: { order: 'asc' },
      include: projectInclude,
    });
    return rows.map((row) => this.toProject(row));
  }

  private publishedServices() {
    return this.prisma.service.findMany({
      where: { published: true },
      orderBy: { order: 'asc' },
      include: serviceInclude,
    });
  }

  /** El número de capítulo sale de la posición entre los publicados: no deja huecos. */
  private toChapter(row: ServiceRow, number: number): ServiceChapter {
    const featured = row.featuredProject?.published ? row.featuredProject : null;
    return {
      slug: row.slug,
      number,
      name: row.name,
      tagline: row.tagline,
      summary: row.summary,
      description: row.description,
      includes: row.includes,
      coverImage: toMediaDto(row.coverImage),
      images: row.images.map((i) => toMediaDto(i.media)),
      featuredProject: featured ? this.toProject(featured) : null,
    };
  }

  private toProject(row: ProjectRow): ProjectDto {
    return {
      id: row.id,
      title: row.title,
      year: row.year,
      location: row.location,
      description: row.description,
      service: row.service,
      beforeImage: toMediaDto(row.beforeImage),
      afterImage: toMediaDto(row.afterImage),
      images: row.images.map((i) => toMediaDto(i.media)),
    };
  }
}
