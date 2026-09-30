import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TurnstileGuard } from './turnstile.guard';
import type { TurnstileService } from './turnstile.service';

const contextWith = (headers: Record<string, string>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ ip: '1.2.3.4', header: (name: string) => headers[name] }),
    }),
  }) as unknown as ExecutionContext;

describe('TurnstileGuard', () => {
  it('deja pasar con un token válido', async () => {
    const verify = jest.fn().mockResolvedValue(true);
    const guard = new TurnstileGuard({ verify } as unknown as TurnstileService);
    await expect(guard.canActivate(contextWith({ 'cf-turnstile-response': 'ok' }))).resolves.toBe(
      true,
    );
    expect(verify).toHaveBeenCalledWith('ok', '1.2.3.4');
  });

  it('responde 403 si la verificación falla', async () => {
    const guard = new TurnstileGuard({
      verify: jest.fn().mockResolvedValue(false),
    } as unknown as TurnstileService);
    await expect(guard.canActivate(contextWith({}))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
