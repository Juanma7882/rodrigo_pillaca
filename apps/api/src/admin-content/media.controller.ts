import {
  BadRequestException,
  Body,
  CallHandler,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  HttpCode,
  Injectable,
  NestInterceptor,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiQuery,
} from '@nestjs/swagger';
import {
  adminMediaPageSchema,
  adminMediaSchema,
  mediaListQuerySchema,
  mediaUpdateSchema,
  mediaUploadSchema,
  type AdminMedia,
  type MediaListQuery,
  type MediaUpdateInput,
  type MediaUploadInput,
  type Paginated,
} from '@tamila/shared';
import { fieldError } from '../common/http-errors';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AdminController, jsonOutput, jsonSchema } from './admin-endpoint.decorator';
import { AdminMediaService } from './media.service';

export const MAX_UPLOAD_MB = 10;

// Sin `storage` ni `dest`, multer guarda el archivo en memoria (file.buffer).
const MulterInterceptor = FileInterceptor('file', {
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
});

/** Recibe una sola imagen en el campo `file` y traduce los errores de multer al español. */
@Injectable()
class ImageUploadInterceptor implements NestInterceptor {
  private readonly multer = new MulterInterceptor();

  async intercept(context: ExecutionContext, next: CallHandler) {
    try {
      return await this.multer.intercept(context, next);
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw new PayloadTooLargeException(`La imagen supera el máximo de ${MAX_UPLOAD_MB} MB`);
      }
      if (error instanceof BadRequestException) {
        throw fieldError('file', 'Enviá una sola imagen en el campo "file"');
      }
      throw error;
    }
  }
}

@AdminController('imágenes')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly media: AdminMediaService) {}

  @Post()
  @UseInterceptors(ImageUploadInterceptor)
  @ApiOperation({
    summary: 'Sube una imagen',
    description:
      'Genera variantes AVIF/WebP de 480, 960 y 1600 px con presupuesto de peso y guarda el ' +
      'original en privado. Subir un archivo idéntico devuelve la imagen existente.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'alt'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'JPEG, PNG, WebP o AVIF' },
        alt: { type: 'string', description: 'Texto alternativo (obligatorio)' },
        credit: { type: 'string', description: 'Crédito de la foto (opcional)' },
      },
    },
  })
  @ApiCreatedResponse({ schema: jsonOutput(adminMediaSchema) })
  @ApiBadRequestResponse({ description: 'Falta la imagen o el alt, o el formato no es válido' })
  @ApiPayloadTooLargeResponse({ description: `La imagen supera los ${MAX_UPLOAD_MB} MB` })
  upload(
    @UploadedFile() file: { buffer: Buffer } | undefined,
    @Body(new ZodValidationPipe(mediaUploadSchema)) body: MediaUploadInput,
  ): Promise<AdminMedia> {
    if (!file) throw fieldError('file', 'Falta la imagen (campo "file")');
    return this.media.upload(file.buffer, body);
  }

  @Get()
  @ApiOperation({ summary: 'Biblioteca de imágenes, de la más nueva a la más vieja' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 24 })
  @ApiQuery({ name: 'unused', required: false, enum: ['true', 'false'] })
  @ApiOkResponse({ schema: jsonOutput(adminMediaPageSchema) })
  @ApiBadRequestResponse({ description: 'Parámetros de paginación inválidos' })
  list(
    @Query(new ZodValidationPipe(mediaListQuerySchema)) query: MediaListQuery,
  ): Promise<Paginated<AdminMedia>> {
    return this.media.list(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita el texto alternativo y el crédito' })
  @ApiBody({ schema: jsonSchema(mediaUpdateSchema) })
  @ApiOkResponse({ schema: jsonOutput(adminMediaSchema) })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'Imagen no encontrada' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(mediaUpdateSchema)) body: MediaUpdateInput,
  ): Promise<AdminMedia> {
    return this.media.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borra una imagen sin uso, con sus archivos' })
  @ApiNoContentResponse({ description: 'Imagen borrada' })
  @ApiNotFoundResponse({ description: 'Imagen no encontrada' })
  @ApiConflictResponse({ description: 'La imagen está en uso' })
  remove(@Param('id') id: string): Promise<void> {
    return this.media.remove(id);
  }
}
