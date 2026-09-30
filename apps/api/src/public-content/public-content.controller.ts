import { Controller, Get, Header, Param } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  projectsResponseSchema,
  serviceDetailSchema,
  servicesResponseSchema,
  siteContentSchema,
  type Project,
  type ServiceChapter,
  type ServiceDetail,
  type SiteContent,
} from '@tamila/shared';
import { z } from 'zod';
import { PublicContentService } from './public-content.service';

const CACHE = 'public, max-age=60, stale-while-revalidate=300';
const jsonSchema = (schema: z.ZodType) => z.toJSONSchema(schema) as Record<string, unknown>;

/** Contenido del sitio público: solo lectura y sin autenticación. */
@ApiTags('contenido público')
@Controller('public')
export class PublicContentController {
  constructor(private readonly content: PublicContentService) {}

  @Get('site')
  @Header('Cache-Control', CACHE)
  @ApiOperation({
    summary: 'Configuración del sitio, links de servicios, pasos y preguntas frecuentes',
  })
  @ApiOkResponse({ schema: jsonSchema(siteContentSchema) })
  site(): Promise<SiteContent> {
    return this.content.site();
  }

  @Get('services')
  @Header('Cache-Control', CACHE)
  @ApiOperation({ summary: 'Servicios publicados, en orden, con el contenido de su capítulo' })
  @ApiOkResponse({ schema: jsonSchema(servicesResponseSchema) })
  services(): Promise<ServiceChapter[]> {
    return this.content.services();
  }

  @Get('services/:slug')
  @Header('Cache-Control', CACHE)
  @ApiOperation({
    summary: 'Detalle de un servicio publicado, con sus trabajos y los servicios vecinos',
  })
  @ApiParam({ name: 'slug', example: 'durlock' })
  @ApiOkResponse({ schema: jsonSchema(serviceDetailSchema) })
  @ApiNotFoundResponse({ description: 'El servicio no existe o no está publicado' })
  service(@Param('slug') slug: string): Promise<ServiceDetail> {
    return this.content.service(slug);
  }

  @Get('projects')
  @Header('Cache-Control', CACHE)
  @ApiOperation({ summary: 'Trabajos realizados publicados' })
  @ApiOkResponse({ schema: jsonSchema(projectsResponseSchema) })
  projects(): Promise<Project[]> {
    return this.content.projects();
  }
}
