import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  adminServiceSchema,
  reorderSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
  type AdminService,
  type ReorderInput,
  type ServiceCreateInput,
  type ServiceUpdateInput,
} from '@tamila/shared';
import { z } from 'zod';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminController, jsonOutput, jsonSchema } from './admin-endpoint.decorator';
import { AdminServicesService } from './services.service';

const one = jsonOutput(adminServiceSchema);
const many = jsonOutput(z.array(adminServiceSchema));

@AdminController('servicios')
@Controller('admin/services')
export class ServicesController {
  constructor(private readonly services: AdminServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Todos los servicios (publicados y no publicados), en orden' })
  @ApiOkResponse({ schema: many })
  list(): Promise<AdminService[]> {
    return this.services.list();
  }

  @Put('order')
  @ApiOperation({ summary: 'Reordena los servicios: recibe todos los ids en el orden deseado' })
  @ApiBody({ schema: jsonSchema(reorderSchema) })
  @ApiOkResponse({ schema: many })
  @ApiBadRequestResponse({ description: 'La lista no tiene exactamente los servicios existentes' })
  reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput): Promise<AdminService[]> {
    return this.services.reorder(body.ids);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Un servicio para editar' })
  @ApiOkResponse({ schema: one })
  @ApiNotFoundResponse({ description: 'Servicio no encontrado' })
  get(@Param('id') id: string): Promise<AdminService> {
    return this.services.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un servicio (queda último y, por defecto, sin publicar)' })
  @ApiBody({ schema: jsonSchema(serviceCreateSchema) })
  @ApiCreatedResponse({ schema: one })
  @ApiBadRequestResponse({ description: 'Datos inválidos o imagen inexistente' })
  @ApiConflictResponse({ description: 'El slug ya está en uso' })
  create(
    @Body(new ZodValidationPipe(serviceCreateSchema)) body: ServiceCreateInput,
  ): Promise<AdminService> {
    return this.services.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita un servicio (la galería se reemplaza completa)' })
  @ApiBody({ schema: jsonSchema(serviceUpdateSchema) })
  @ApiOkResponse({ schema: one })
  @ApiBadRequestResponse({
    description: 'Datos inválidos, imagen inexistente o destacado de otro servicio',
  })
  @ApiNotFoundResponse({ description: 'Servicio no encontrado' })
  @ApiConflictResponse({ description: 'El slug ya está en uso' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(serviceUpdateSchema)) body: ServiceUpdateInput,
  ): Promise<AdminService> {
    return this.services.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Borra un servicio sin trabajos (sus imágenes quedan en la biblioteca)',
  })
  @ApiNoContentResponse({ description: 'Servicio borrado' })
  @ApiNotFoundResponse({ description: 'Servicio no encontrado' })
  @ApiConflictResponse({ description: 'El servicio tiene trabajos asociados' })
  remove(@Param('id') id: string): Promise<void> {
    return this.services.remove(id);
  }
}
