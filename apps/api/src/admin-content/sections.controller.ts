import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  adminFaqSchema,
  adminProcessStepSchema,
  faqCreateSchema,
  faqUpdateSchema,
  processStepCreateSchema,
  processStepUpdateSchema,
  reorderSchema,
  type AdminFaq,
  type AdminProcessStep,
  type FaqCreateInput,
  type FaqUpdateInput,
  type ProcessStepCreateInput,
  type ProcessStepUpdateInput,
  type ReorderInput,
} from '@tamila/shared';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminController, jsonOutput, jsonSchema } from './admin-endpoint.decorator';
import { AdminSectionsService } from './sections.service';

const reorderBody = new ZodValidationPipe(reorderSchema);
const INVALID_ORDER = 'La lista no tiene exactamente los elementos existentes';

@AdminController('cómo trabajamos')
@Controller('admin/process-steps')
export class ProcessStepsController {
  constructor(private readonly sections: AdminSectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Pasos de "Cómo trabajamos", en orden' })
  @ApiOkResponse({ schema: jsonOutput(z.array(adminProcessStepSchema)) })
  list(): Promise<AdminProcessStep[]> {
    return this.sections.listSteps();
  }

  @Put('order')
  @ApiOperation({ summary: 'Reordena los pasos: recibe todos los ids en el orden deseado' })
  @ApiBody({ schema: jsonSchema(reorderSchema) })
  @ApiOkResponse({ schema: jsonOutput(z.array(adminProcessStepSchema)) })
  @ApiBadRequestResponse({ description: INVALID_ORDER })
  reorder(@Body(reorderBody) body: ReorderInput): Promise<AdminProcessStep[]> {
    return this.sections.reorderSteps(body.ids);
  }

  @Post()
  @ApiOperation({ summary: 'Agrega un paso al final' })
  @ApiBody({ schema: jsonSchema(processStepCreateSchema) })
  @ApiCreatedResponse({ schema: jsonOutput(adminProcessStepSchema) })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(
    @Body(new ZodValidationPipe(processStepCreateSchema)) body: ProcessStepCreateInput,
  ): Promise<AdminProcessStep> {
    return this.sections.createStep(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita un paso' })
  @ApiBody({ schema: jsonSchema(processStepUpdateSchema) })
  @ApiOkResponse({ schema: jsonOutput(adminProcessStepSchema) })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'Paso no encontrado' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(processStepUpdateSchema)) body: ProcessStepUpdateInput,
  ): Promise<AdminProcessStep> {
    return this.sections.updateStep(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borra un paso y renumera los demás' })
  @ApiNoContentResponse({ description: 'Paso borrado' })
  @ApiNotFoundResponse({ description: 'Paso no encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.sections.removeStep(id);
  }
}

@AdminController('preguntas frecuentes')
@Controller('admin/faqs')
export class FaqsController {
  constructor(private readonly sections: AdminSectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Preguntas frecuentes en orden (publicadas y no publicadas)' })
  @ApiOkResponse({ schema: jsonOutput(z.array(adminFaqSchema)) })
  list(): Promise<AdminFaq[]> {
    return this.sections.listFaqs();
  }

  @Put('order')
  @ApiOperation({ summary: 'Reordena las preguntas: recibe todos los ids en el orden deseado' })
  @ApiBody({ schema: jsonSchema(reorderSchema) })
  @ApiOkResponse({ schema: jsonOutput(z.array(adminFaqSchema)) })
  @ApiBadRequestResponse({ description: INVALID_ORDER })
  reorder(@Body(reorderBody) body: ReorderInput): Promise<AdminFaq[]> {
    return this.sections.reorderFaqs(body.ids);
  }

  @Post()
  @ApiOperation({ summary: 'Agrega una pregunta al final (publicada por defecto)' })
  @ApiBody({ schema: jsonSchema(faqCreateSchema) })
  @ApiCreatedResponse({ schema: jsonOutput(adminFaqSchema) })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  create(@Body(new ZodValidationPipe(faqCreateSchema)) body: FaqCreateInput): Promise<AdminFaq> {
    return this.sections.createFaq(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita una pregunta' })
  @ApiBody({ schema: jsonSchema(faqUpdateSchema) })
  @ApiOkResponse({ schema: jsonOutput(adminFaqSchema) })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'Pregunta no encontrada' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(faqUpdateSchema)) body: FaqUpdateInput,
  ): Promise<AdminFaq> {
    return this.sections.updateFaq(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borra una pregunta y renumera las demás' })
  @ApiNoContentResponse({ description: 'Pregunta borrada' })
  @ApiNotFoundResponse({ description: 'Pregunta no encontrada' })
  remove(@Param('id') id: string): Promise<void> {
    return this.sections.removeFaq(id);
  }
}
