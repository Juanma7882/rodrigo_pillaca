import { Logger } from '@nestjs/common';
import type { Env } from '../config/env';
import { TURNSTILE_VERIFY_URL, TurnstileService } from './turnstile.service';

const env = { TURNSTILE_SECRET_KEY: 'secreto' } as Env;

describe('TurnstileService', () => {
  const fetchMock = jest.fn();
  let service: TurnstileService;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    service = new TurnstileService(env);
    // Los casos de falla cerrada registran errores a propósito.
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  const respond = (body: unknown, ok = true) =>
    fetchMock.mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body });

  it('acepta un token que Cloudflare valida', async () => {
    respond({ success: true });
    await expect(service.verify('token', '1.2.3.4')).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TURNSTILE_VERIFY_URL);
    const body = init.body as URLSearchParams;
    expect(body.get('secret')).toBe('secreto');
    expect(body.get('response')).toBe('token');
    expect(body.get('remoteip')).toBe('1.2.3.4');
  });

  it('rechaza sin consultar a Cloudflare si no hay token', async () => {
    await expect(service.verify(undefined)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rechaza un token inválido', async () => {
    respond({ success: false, 'error-codes': ['invalid-input-response'] });
    await expect(service.verify('malo')).resolves.toBe(false);
  });

  it('falla cerrada si Cloudflare responde con error', async () => {
    respond({}, false);
    await expect(service.verify('token')).resolves.toBe(false);
  });

  it('falla cerrada ante un error de red o timeout', async () => {
    fetchMock.mockRejectedValue(new Error('The operation was aborted due to timeout'));
    await expect(service.verify('token')).resolves.toBe(false);
  });
});
