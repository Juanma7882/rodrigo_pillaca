import { Inject, Injectable, Logger } from '@nestjs/common';
import { ENV, type Env } from '../config/env';

export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 5000;

type SiteverifyResponse = { success: boolean; 'error-codes'?: string[] };

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(@Inject(ENV) private readonly env: Env) {}

  /** Verifica el token con Cloudflare. Ante cualquier falla devuelve false (falla cerrada). */
  async verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    if (!token) return false;
    const body = new URLSearchParams({ secret: this.env.TURNSTILE_SECRET_KEY, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);

    try {
      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) {
        this.logger.error(`Turnstile respondió ${response.status}: se rechaza la solicitud`);
        return false;
      }
      const result = (await response.json()) as SiteverifyResponse;
      if (!result.success) {
        this.logger.warn(
          `Token de Turnstile rechazado: ${result['error-codes']?.join(', ') ?? 'sin código'}`,
        );
      }
      return result.success === true;
    } catch (error) {
      this.logger.error(`No se pudo verificar Turnstile: ${(error as Error).message}`);
      return false;
    }
  }
}
