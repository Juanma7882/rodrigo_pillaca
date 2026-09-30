import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const DEFAULT_MESSAGES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'La solicitud no es válida',
  [HttpStatus.UNAUTHORIZED]: 'No autenticado',
  [HttpStatus.FORBIDDEN]: 'Acceso denegado',
  [HttpStatus.NOT_FOUND]: 'Recurso no encontrado',
  [HttpStatus.METHOD_NOT_ALLOWED]: 'Método no permitido',
  [HttpStatus.PAYLOAD_TOO_LARGE]: 'La solicitud es demasiado grande',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Demasiadas solicitudes',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'Servicio no disponible',
};

const NEST_DEFAULT_MESSAGES = new Set([
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Method Not Allowed',
  'Payload Too Large',
  'Too Many Requests',
  'ThrottlerException: Too Many Requests',
  'Service Unavailable',
  'Service Unavailable Exception',
  'Internal Server Error',
]);

/** Formato de error uniforme: { statusCode, message, path } (+ errors en validaciones). */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocurrió un error inesperado. Intentá de nuevo más tarde.';
    let errors: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === 'string' ? body : (body as { message?: unknown }).message;
      errors = typeof body === 'object' ? (body as { errors?: unknown }).errors : undefined;
      message = this.spanish(status, typeof raw === 'string' ? raw : undefined);
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.originalUrl,
      ...(errors ? { errors } : {}),
    });
  }

  /** Nest genera algunos mensajes en inglés (p. ej. "Cannot GET /x"): se reemplazan. */
  private spanish(status: number, message?: string): string {
    const isNestDefault =
      !message || NEST_DEFAULT_MESSAGES.has(message) || /^Cannot [A-Z]+ \//.test(message);
    return isNestDefault ? (DEFAULT_MESSAGES[status] ?? message ?? 'Error') : message;
  }
}
