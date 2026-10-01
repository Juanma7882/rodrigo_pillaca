import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdminProject, ProjectCreateInput, ProjectUpdateInput } from '@tamila/shared';
import { fieldError } from '../common/http-errors';
import { assertMediaExists } from '../common/media-refs';
import { applyOrder, assertSameIds, nextOrder, renumber } from '../common/ordering';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { adminProjectInclude, toAdminProject } from './mappers';

const NOT_FOUND = 'Trabajo no encontrado';

@Injectable()
export class AdminProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(serviceId?: string): Promise<AdminProject[]> {
    const rows = await this.prisma.project.findMany({
      where: serviceId ? { serviceId } : {},
      orderBy: { order: 'asc' },
      include: adminProjectInclude,
    });
    return rows.map(toAdminProject);
  }

  async get(id: string): Promise<AdminProject> {
    const row = await this.prisma.project.findUnique({
      where: { id },
      include: adminProjectInclude,
    });
    if (!row) throw new NotFoundException(NOT_FOUND);
    return toAdminProject(row);
  }

  async create(input: ProjectCreateInput): Promise<AdminProject> {
    const { imageIds, ...data } = input;
    await this.assertService(data.serviceId);
    await assertMediaExists(this.prisma, {
      beforeImageId: data.beforeImageId,
      afterImageId: data.afterImageId,
      imageIds,
    });
    const id = await this.prisma.$transaction(async (tx) => {
      const order = await nextOrder(tx, 'projects');
      const row = await tx.project.create({ data: { ...data, order } });
      await this.replaceGallery(tx, row.id, imageIds);
      return row.id;
    });
    return this.get(id);
  }

  async update(id: string, input: ProjectUpdateInput): Promise<AdminProject> {
    const current = await this.prisma.project.findUnique({
      where: { id },
      select: { serviceId: true },
    });
    if (!current) throw new NotFoundException(NOT_FOUND);
    const { imageIds, ...data } = input;
    if (data.serviceId) await this.assertService(data.serviceId);
    await assertMediaExists(this.prisma, {
      beforeImageId: data.beforeImageId,
      afterImageId: data.afterImageId,
      imageIds,
    });

    await this.prisma.$transaction(async (tx) => {
      // Un trabajo que cambia de rubro deja de ser el destacado del servicio anterior.
      if (data.serviceId && data.serviceId !== current.serviceId) {
        await tx.service.updateMany({
          where: { id: current.serviceId, featuredProjectId: id },
          data: { featuredProjectId: null },
        });
      }
      await tx.project.update({ where: { id }, data });
      if (imageIds) await this.replaceGallery(tx, id, imageIds);
    });
    return this.get(id);
  }

  async reorder(ids: string[]): Promise<AdminProject[]> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.project.findMany({ select: { id: true } });
      assertSameIds(
        existing.map((p) => p.id),
        ids,
      );
      await applyOrder(tx, 'projects', ids);
    });
    return this.list();
  }

  /** Si era el destacado de su servicio, la base lo quita (SetNull). */
  async remove(id: string): Promise<void> {
    const count = await this.prisma.project.count({ where: { id } });
    if (!count) throw new NotFoundException(NOT_FOUND);
    await this.prisma.$transaction(async (tx) => {
      await tx.project.delete({ where: { id } });
      await renumber(tx, 'projects');
    });
  }

  private async assertService(serviceId: string) {
    const count = await this.prisma.service.count({ where: { id: serviceId } });
    if (!count) throw fieldError('serviceId', 'El servicio no existe');
  }

  private async replaceGallery(tx: Prisma.TransactionClient, projectId: string, ids: string[]) {
    await tx.projectImage.deleteMany({ where: { projectId } });
    await tx.projectImage.createMany({
      data: ids.map((mediaId, order) => ({ projectId, mediaId, order })),
    });
  }
}
