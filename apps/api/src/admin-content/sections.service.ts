import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  AdminFaq,
  AdminProcessStep,
  FaqCreateInput,
  FaqUpdateInput,
  ProcessStepCreateInput,
  ProcessStepUpdateInput,
} from '@tamila/shared';
import { applyOrder, assertSameIds, nextOrder, renumber } from '../common/ordering';
import { PrismaService } from '../prisma/prisma.service';
import { toAdminFaq, toAdminProcessStep } from './mappers';

const STEP_NOT_FOUND = 'Paso no encontrado';
const FAQ_NOT_FOUND = 'Pregunta no encontrada';

/** Secciones simples del inicio: "Cómo trabajamos" y preguntas frecuentes. */
@Injectable()
export class AdminSectionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Pasos ──────────────────────────────────────────────────────────────

  async listSteps(): Promise<AdminProcessStep[]> {
    const rows = await this.prisma.processStep.findMany({ orderBy: { order: 'asc' } });
    return rows.map(toAdminProcessStep);
  }

  async createStep(input: ProcessStepCreateInput): Promise<AdminProcessStep> {
    const row = await this.prisma.$transaction(async (tx) =>
      tx.processStep.create({ data: { ...input, order: await nextOrder(tx, 'process_steps') } }),
    );
    return toAdminProcessStep(row);
  }

  async updateStep(id: string, input: ProcessStepUpdateInput): Promise<AdminProcessStep> {
    if (!(await this.prisma.processStep.count({ where: { id } }))) {
      throw new NotFoundException(STEP_NOT_FOUND);
    }
    return toAdminProcessStep(await this.prisma.processStep.update({ where: { id }, data: input }));
  }

  async removeStep(id: string): Promise<void> {
    if (!(await this.prisma.processStep.count({ where: { id } }))) {
      throw new NotFoundException(STEP_NOT_FOUND);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.processStep.delete({ where: { id } });
      await renumber(tx, 'process_steps');
    });
  }

  async reorderSteps(ids: string[]): Promise<AdminProcessStep[]> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.processStep.findMany({ select: { id: true } });
      assertSameIds(
        existing.map((s) => s.id),
        ids,
      );
      await applyOrder(tx, 'process_steps', ids);
    });
    return this.listSteps();
  }

  // ─── Preguntas frecuentes ───────────────────────────────────────────────

  async listFaqs(): Promise<AdminFaq[]> {
    const rows = await this.prisma.faq.findMany({ orderBy: { order: 'asc' } });
    return rows.map(toAdminFaq);
  }

  async createFaq(input: FaqCreateInput): Promise<AdminFaq> {
    const row = await this.prisma.$transaction(async (tx) =>
      tx.faq.create({ data: { ...input, order: await nextOrder(tx, 'faqs') } }),
    );
    return toAdminFaq(row);
  }

  async updateFaq(id: string, input: FaqUpdateInput): Promise<AdminFaq> {
    if (!(await this.prisma.faq.count({ where: { id } }))) {
      throw new NotFoundException(FAQ_NOT_FOUND);
    }
    return toAdminFaq(await this.prisma.faq.update({ where: { id }, data: input }));
  }

  async removeFaq(id: string): Promise<void> {
    if (!(await this.prisma.faq.count({ where: { id } }))) {
      throw new NotFoundException(FAQ_NOT_FOUND);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.faq.delete({ where: { id } });
      await renumber(tx, 'faqs');
    });
  }

  async reorderFaqs(ids: string[]): Promise<AdminFaq[]> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.faq.findMany({ select: { id: true } });
      assertSameIds(
        existing.map((f) => f.id),
        ids,
      );
      await applyOrder(tx, 'faqs', ids);
    });
    return this.listFaqs();
  }
}
