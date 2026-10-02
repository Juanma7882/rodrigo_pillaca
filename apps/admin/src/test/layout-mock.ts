import { fireEvent, waitFor } from '@testing-library/react';
import { afterAll, beforeAll, expect } from 'vitest';

/**
 * jsdom no calcula layout y dnd-kit lo necesita para mover con el teclado: cada fila (<li>)
 * pasa a medir 50 px de alto, una debajo de la otra.
 */
export function mockRowLayout() {
  const original = Element.prototype.getBoundingClientRect;
  beforeAll(() => {
    Element.prototype.getBoundingClientRect = function () {
      const row = this.closest('li');
      const index = row ? Array.from(row.parentElement!.children).indexOf(row) : 0;
      const top = index * 50;
      return {
        x: 0,
        y: top,
        top,
        left: 0,
        width: 300,
        height: 50,
        right: 300,
        bottom: top + 50,
        toJSON: () => ({}),
      } as DOMRect;
    };
  });
  afterAll(() => {
    Element.prototype.getBoundingClientRect = original;
  });
}

/** Mueve un elemento con el teclado: Espacio, `steps` flechas (negativo = arriba) y Espacio. */
export async function moveWithKeyboard(handle: HTMLElement, steps: number) {
  handle.focus();
  fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
  await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'));
  const key = steps > 0 ? 'ArrowDown' : 'ArrowUp';
  for (let i = 0; i < Math.abs(steps); i++) fireEvent.keyDown(handle, { code: key, key });
  fireEvent.keyDown(handle, { code: 'Space', key: ' ' });
}
