import { Body, Controller, Get, NotFoundException, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  adminSettingsSchema,
  settingsUpdateSchema,
  type AdminSettings,
  type SettingsUpdateInput,
} from '@tamila/shared';
import { assertMediaExists } from '../common/media-refs';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PrismaService } from '../prisma/prisma.service';
import { AdminController, jsonOutput, jsonSchema } from './admin-endpoint.decorator';
import { adminSettingsInclude, toAdminSettings } from './mappers';

const NOT_LOADED = 'El contenido del sitio todavía no fue cargado (corré seed:content)';

@AdminController('configuración')
@Controller('admin/settings')
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Configuración completa del sitio para editar' })
  @ApiOkResponse({ schema: jsonOutput(adminSettingsSchema) })
  @ApiNotFoundResponse({ description: NOT_LOADED })
  async get(): Promise<AdminSettings> {
    const row = await this.prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: adminSettingsInclude,
    });
    if (!row) throw new NotFoundException(NOT_LOADED);
    return toAdminSettings(row);
  }

  @Patch()
  @ApiOperation({ summary: 'Actualiza parcialmente la configuración del sitio' })
  @ApiBody({ schema: jsonSchema(settingsUpdateSchema) })
  @ApiOkResponse({ schema: jsonOutput(adminSettingsSchema) })
  @ApiBadRequestResponse({ description: 'Datos inválidos o imagen inexistente' })
  @ApiNotFoundResponse({ description: NOT_LOADED })
  async update(
    @Body(new ZodValidationPipe(settingsUpdateSchema)) body: SettingsUpdateInput,
  ): Promise<AdminSettings> {
    await assertMediaExists(this.prisma, {
      heroImageId: body.heroImageId,
      ogImageId: body.ogImageId,
    });
    const exists = await this.prisma.siteSettings.count({ where: { id: 1 } });
    if (!exists) throw new NotFoundException(NOT_LOADED);
    const row = await this.prisma.siteSettings.update({
      where: { id: 1 },
      data: body,
      include: adminSettingsInclude,
    });
    return toAdminSettings(row);
  }
}
