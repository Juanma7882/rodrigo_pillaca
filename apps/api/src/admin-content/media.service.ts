import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  AdminMedia,
  MediaListQuery,
  MediaUpdateInput,
  MediaUploadInput,
  MediaUsage,
  Paginated,
} from '@tamila/shared';
import { fieldError } from '../common/http-errors';
import { ENV, type Env } from '../config/env';
import type { MediaAsset, Prisma } from '../generated/prisma/client';
import { detectImageFormat, type ProcessedVariant } from '../media/media-processor';
import { removeImageFiles, storeImage, toMediaDto, type MediaDirs } from '../media/media-store';
import { PrismaService } from '../prisma/prisma.service';

const NOT_FOUND = 'Imagen no encontrada';
const INVALID_FORMAT =
  'El archivo no es una imagen válida: usá JPEG, PNG, WebP o AVIF (las fotos HEIC del iPhone exportalas como JPEG)';

/** Filtro de imágenes que no usa ningún contenido. */
const unusedWhere = {
  siteHeroImage: { none: {} },
  siteOgImage: { none: {} },
  serviceCovers: { none: {} },
  serviceImages: { none: {} },
  projectBefore: { none: {} },
  projectAfter: { none: {} },
  projectImages: { none: {} },
} satisfies Prisma.MediaAssetWhereInput;

@Injectable()
export class AdminMediaService {
  private readonly logger = new Logger(AdminMediaService.name);
  private readonly dirs: MediaDirs;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) env: Env,
  ) {
    this.dirs = { mediaDir: env.MEDIA_DIR, originalsDir: env.MEDIA_ORIGINALS_DIR };
  }

  /** Valida el formato por el contenido, genera las variantes y guarda el original. */
  async upload(file: Buffer, meta: MediaUploadInput): Promise<AdminMedia> {
    if (!(await detectImageFormat(file))) throw fieldError('file', INVALID_FORMAT);
    let asset: MediaAsset;
    try {
      asset = await storeImage(this.prisma, this.dirs, file, meta);
    } catch (error) {
      if (/pixel limit/i.test((error as Error).message)) {
        throw fieldError('file', 'La imagen tiene demasiados píxeles (máximo 40 megapíxeles)');
      }
      throw error;
    }
    return this.toAdminMedia(asset, (await this.usages([asset.id])).get(asset.id) ?? []);
  }

  async list(query: MediaListQuery): Promise<Paginated<AdminMedia>> {
    const where = query.unused ? unusedWhere : {};
    const [rows, total] = await Promise.all([
      this.prisma.mediaAsset.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.mediaAsset.count({ where }),
    ]);
    const usages = await this.usages(rows.map((r) => r.id));
    return {
      items: rows.map((row) => this.toAdminMedia(row, usages.get(row.id) ?? [])),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async update(id: string, input: MediaUpdateInput): Promise<AdminMedia> {
    if (!(await this.prisma.mediaAsset.count({ where: { id } }))) {
      throw new NotFoundException(NOT_FOUND);
    }
    const row = await this.prisma.mediaAsset.update({ where: { id }, data: input });
    return this.toAdminMedia(row, (await this.usages([id])).get(id) ?? []);
  }

  /** Solo se borra una imagen sin uso; se eliminan también sus archivos y el original. */
  async remove(id: string): Promise<void> {
    const row = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(NOT_FOUND);
    const usages = (await this.usages([id])).get(id) ?? [];
    if (usages.length > 0) {
      throw new ConflictException(
        `La imagen está en uso (${usages.map((u) => u.label).join(', ')}): quitala de esos lugares antes de borrarla`,
      );
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
    try {
      await removeImageFiles(this.dirs, row);
    } catch (error) {
      // La fila ya no existe: los archivos que quedan son huérfanos inofensivos.
      this.logger.error(
        `No se pudieron borrar los archivos de ${row.hash}: ${(error as Error).message}`,
      );
    }
  }

  /** Dónde se usa cada imagen (hero, OG, portadas, galerías, antes/después). */
  async usages(ids: string[]): Promise<Map<string, MediaUsage[]>> {
    const result = new Map<string, MediaUsage[]>(ids.map((id) => [id, []]));
    if (ids.length === 0) return result;
    const add = (mediaId: string | null, usage: MediaUsage) => {
      if (mediaId) result.get(mediaId)?.push(usage);
    };
    const inIds = { in: ids };

    const [settings, covers, serviceGallery, before, after, projectGallery] = await Promise.all([
      this.prisma.siteSettings.findUnique({
        where: { id: 1 },
        select: { heroImageId: true, ogImageId: true },
      }),
      this.prisma.service.findMany({
        where: { coverImageId: inIds },
        select: { id: true, name: true, coverImageId: true },
      }),
      this.prisma.serviceImage.findMany({
        where: { mediaId: inIds },
        select: { mediaId: true, service: { select: { id: true, name: true } } },
      }),
      this.prisma.project.findMany({
        where: { beforeImageId: inIds },
        select: { id: true, title: true, beforeImageId: true },
      }),
      this.prisma.project.findMany({
        where: { afterImageId: inIds },
        select: { id: true, title: true, afterImageId: true },
      }),
      this.prisma.projectImage.findMany({
        where: { mediaId: inIds },
        select: { mediaId: true, project: { select: { id: true, title: true } } },
      }),
    ]);

    add(settings?.heroImageId ?? null, { kind: 'hero', id: '1', label: 'Foto del hero' });
    add(settings?.ogImageId ?? null, { kind: 'og', id: '1', label: 'Imagen para redes (OG)' });
    for (const s of covers) {
      add(s.coverImageId, { kind: 'serviceCover', id: s.id, label: `Portada de ${s.name}` });
    }
    for (const i of serviceGallery) {
      add(i.mediaId, {
        kind: 'serviceGallery',
        id: i.service.id,
        label: `Galería de ${i.service.name}`,
      });
    }
    for (const p of before) {
      add(p.beforeImageId, { kind: 'projectBefore', id: p.id, label: `Antes de "${p.title}"` });
    }
    for (const p of after) {
      add(p.afterImageId, { kind: 'projectAfter', id: p.id, label: `Después de "${p.title}"` });
    }
    for (const i of projectGallery) {
      add(i.mediaId, {
        kind: 'projectGallery',
        id: i.project.id,
        label: `Galería de "${i.project.title}"`,
      });
    }
    return result;
  }

  private toAdminMedia(row: MediaAsset, usages: MediaUsage[]): AdminMedia {
    // Las imágenes procesadas antes de registrar los pesos no los tienen: se informan como 0.
    const sizes = (row.variants as Partial<ProcessedVariant>[]).map((v) => ({
      width: v.width ?? 0,
      avifBytes: v.avifBytes ?? 0,
      webpBytes: v.webpBytes ?? 0,
    }));
    return {
      ...toMediaDto(row),
      createdAt: row.createdAt.toISOString(),
      sizes,
      totalBytes: sizes.reduce((sum, s) => sum + s.avifBytes + s.webpBytes, 0),
      usages,
    };
  }
}
