import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import {
  adminProjectSchema,
  projectCreateSchema,
  projectListQuerySchema,
  projectUpdateSchema,
  reorderSchema,
  type AdminProject,
  type ProjectCreateInput,
  type ProjectUpdateInput,
  type ReorderInput,
} from '@tamila/shared';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminController, jsonOutput, jsonSchema } from './admin-endpoint.decorator';
import { AdminProjectsService } from './projects.service';

const one = jsonOutput(adminProjectSchema);
const many = jsonOutput(z.array(adminProjectSchema));

@AdminController('trabajos')
@Controller('admin/projects')
export class ProjectsController {
  constructor(private readonly projects: AdminProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Todos los trabajos en orden (publicados y no publicados)' })
  @ApiQuery({ name: 'serviceId', required: false, description: 'Filtra por servicio' })
  @ApiOkResponse({ schema: many })
  @ApiBadRequestResponse({ description: 'serviceId inválido' })
  list(
    @Query(new ZodValidationPipe(projectListQuerySchema)) query: { serviceId?: string },
  ): Promise<AdminProject[]> {
    return this.projects.list(query.serviceId);
  }

  @Put('order')
  @ApiOperation({ summary: 'Reordena los trabajos: recibe todos los ids en el orden deseado' })
  @ApiBody({ schema: jsonSchema(reorderSchema) })
  @ApiOkResponse({ schema: many })
  @ApiBadRequestResponse({ description: 'La lista no tiene exactamente los trabajos existentes' })
  reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput): Promise<AdminProject[]> {
    return this.projects.reorder(body.ids);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Un trabajo para editar' })
  @ApiOkResponse({ schema: one })
  @ApiNotFoundResponse({ description: 'Trabajo no encontrado' })
  get(@Param('id') id: string): Promise<AdminProject> {
    return this.projects.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un trabajo (queda último y, por defecto, sin publicar)' })
  @ApiBody({ schema: jsonSchema(projectCreateSchema) })
  @ApiCreatedResponse({ schema: one })
  @ApiBadRequestResponse({ description: 'Datos inválidos, servicio o imagen inexistente' })
  create(
    @Body(new ZodValidationPipe(projectCreateSchema)) body: ProjectCreateInput,
  ): Promise<AdminProject> {
    return this.projects.create(body);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edita un trabajo (la galería se reemplaza completa)',
    description: 'Si cambia de servicio, deja de ser el destacado del servicio anterior.',
  })
  @ApiBody({ schema: jsonSchema(projectUpdateSchema) })
  @ApiOkResponse({ schema: one })
  @ApiBadRequestResponse({ description: 'Datos inválidos, servicio o imagen inexistente' })
  @ApiNotFoundResponse({ description: 'Trabajo no encontrado' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(projectUpdateSchema)) body: ProjectUpdateInput,
  ): Promise<AdminProject> {
    return this.projects.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borra un trabajo (sus imágenes quedan en la biblioteca)' })
  @ApiNoContentResponse({ description: 'Trabajo borrado' })
  @ApiNotFoundResponse({ description: 'Trabajo no encontrado' })
  remove(@Param('id') id: string): Promise<void> {
    return this.projects.remove(id);
  }
}
