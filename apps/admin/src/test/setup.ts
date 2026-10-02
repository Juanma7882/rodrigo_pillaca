import '@testing-library/jest-dom/vitest';
import { toast } from '@tamila/ui';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

// jsdom no implementa ResizeObserver (lo usan algunos componentes de Radix, como Switch).
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// jsdom no implementa las URLs de objetos (vistas previas de las fotos elegidas).
URL.createObjectURL = vi.fn(() => 'blob:vista-previa');
URL.revokeObjectURL = vi.fn();

afterEach(() => {
  cleanup();
  // Los avisos de sonner viven en un estado global: no deben pasar de un test a otro.
  toast.dismiss();
});
