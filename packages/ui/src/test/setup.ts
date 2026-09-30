import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

let prefersDark = false;

/** Simula la preferencia de color del sistema operativo. */
export function setSystemDark(value: boolean) {
  prefersDark = value;
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes('dark') ? prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  prefersDark = false;
  if (typeof window === 'undefined') return;
  cleanup();
  localStorage.clear();
  document.documentElement.className = '';
});
