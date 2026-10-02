import { ApiError } from '@/features/auth';
import { toast } from '@tamila/ui';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyApiErrors, fieldPath } from './api-errors';
import { slugify } from './slugify';

vi.mock('@tamila/ui', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  toast: { error: vi.fn(), success: vi.fn() },
}));

describe('slugify', () => {
  it.each([
    ['Instalación de aire', 'instalacion-de-aire'],
    ['  Pisos   flotantes & madera ', 'pisos-flotantes-madera'],
    ['Ñandú 2026', 'nandu-2026'],
    ['---', ''],
  ])('%s → %s', (input, slug) => {
    expect(slugify(input)).toBe(slug);
  });

  it('no supera 60 caracteres ni termina en guion', () => {
    const slug = slugify(`${'a'.repeat(59)} b`);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });
});

describe('applyApiErrors', () => {
  afterEach(() => vi.clearAllMocks());

  it('lleva cada error 400 a su campo y los índices de listas al campo de la lista', () => {
    const setError = vi.fn();
    applyApiErrors(
      new ApiError(400, 'Los datos enviados no son válidos', [
        { field: 'imageIds.2', message: 'La imagen no existe' },
        { field: 'name', message: 'Este campo es obligatorio' },
      ]),
      setError,
    );
    expect(setError).toHaveBeenCalledWith('imageIds', {
      type: 'server',
      message: 'La imagen no existe',
    });
    expect(setError).toHaveBeenCalledWith('name', {
      type: 'server',
      message: 'Este campo es obligatorio',
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('lleva el 409 al campo indicado', () => {
    const setError = vi.fn();
    applyApiErrors(new ApiError(409, 'El slug "durlock" ya está en uso'), setError, {
      conflictField: 'slug',
    });
    expect(setError).toHaveBeenCalledWith('slug', {
      type: 'server',
      message: 'El slug "durlock" ya está en uso',
    });
  });

  it('un error de red o un conflicto sin campo van a un toast', () => {
    const setError = vi.fn();
    applyApiErrors(new ApiError(0, 'No pudimos conectarnos con el servidor.'), setError);
    applyApiErrors(new ApiError(409, 'El servicio tiene 2 trabajos'), setError);
    expect(toast.error).toHaveBeenNthCalledWith(1, 'No pudimos conectarnos con el servidor.');
    expect(toast.error).toHaveBeenNthCalledWith(2, 'El servicio tiene 2 trabajos');
    expect(setError).not.toHaveBeenCalled();
  });

  it('fieldPath quita los índices finales', () => {
    expect(fieldPath('imageIds.2')).toBe('imageIds');
    expect(fieldPath('seoTitle')).toBe('seoTitle');
  });
});
