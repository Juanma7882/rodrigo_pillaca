import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AdminService, ServiceCreateInput, ServiceUpdateInput } from '@tamila/shared';
import { fieldError, prismaConflict } from '../common/http-errors';
import { assertMediaExists } from '../common/media-refs';
import { applyOrder, assertSameIds, nextOrder, renumber } from '../common/ordering';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { adminServiceInclude, toAdminService } from './mappers';

const NOT_FOUND = 'Servicio no encontrado';
const slugTaken = (slug?: string) => `El slug "${slug}" ya está en uso por otro servicio`;

@Injectable()
export class AdminServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AdminService[]> {
    const rows = await this.prisma.service.findMany({
      orderBy: { order: 'asc' },
      include: adminServiceInclude,
    });
    return rows.map(toAdminService);
  }

  async get(id: string): Promise<AdminService> {
    const row = await this.prisma.service.findUnique({
      where: { id },
      include: adminServiceInclude,
    });
    if (!row) throw new NotFoundException(NOT_FOUND);
    return toAdminService(row);
  }

  async create(input: ServiceCreateInput): Promise<AdminService> {
    const { imageIds, ...data } = input;
    await assertMediaExists(this.prisma, { coverImageId: data.coverImageId, imageIds });
    try {
      const id = await this.prisma.$transaction(async (tx) => {
        const order = await nextOrder(tx, 'services');
        const row = await tx.service.create({ data: { ...data, order } });
        await this.replaceGallery(tx, row.id, imageIds);
        return row.id;
      });
      return this.get(id);
    } catch (error) {
      prismaConflict(error, slugTaken(input.slug));
    }
  }

  async update(id: string, input: ServiceUpdateInput): Promise<AdminService> {
    await this.ensureExists(id);
    const { imageIds, ...data } = input;
    await assertMediaExists(this.prisma, { coverImageId: data.coverImageId, imageIds });
    if (data.featuredProjectId) await this.assertOwnProject(id, data.featuredProjectId);
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.service.update({ where: { id }, data });
        if (imageIds) await this.replaceGallery(tx, id, imageIds);
      });
    } catch (error) {
      prismaConflict(error, slugTaken(input.slug));
    }
    return this.get(id);
  }

  async reorder(ids: string[]): Promise<AdminService[]> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.service.findMany({ select: { id: true } });
      assertSameIds(
        existing.map((s) => s.id),
        ids,
      );
      await applyOrder(tx, 'services', ids);
    });
    return this.list();
  }

  /** No se borra un servicio con trabajos: la relación en la base los borraría en cascada. */
  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    const projects = await this.prisma.project.count({ where: { serviceId: id } });
    if (projects > 0) {
      throw new ConflictException(
        `El servicio tiene ${projects} ${projects === 1 ? 'trabajo' : 'trabajos'}: movelos a otro servicio o borralos antes, o despublicá el servicio`,
      );
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.service.delete({ where: { id } });
      await renumber(tx, 'services');
    });
  }

  private async ensureExists(id: string) {
    const count = await this.prisma.service.count({ where: { id } });
    if (!count) throw new NotFoundException(NOT_FOUND);
  }

  private async assertOwnProject(serviceId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { serviceId: true },
    });
    if (project?.serviceId !== serviceId) {
      throw fieldError('featuredProjectId', 'El trabajo destacado tiene que ser de este servicio');
    }
  }

  private async replaceGallery(tx: Prisma.TransactionClient, serviceId: string, ids: string[]) {
    await tx.serviceImage.deleteMany({ where: { serviceId } });
    await tx.serviceImage.createMany({
      data: ids.map((mediaId, order) => ({ serviceId, mediaId, order })),
    });
  }
}
