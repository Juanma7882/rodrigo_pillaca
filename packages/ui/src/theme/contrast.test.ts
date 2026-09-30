// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../theme.css', import.meta.url)), 'utf8');

function tokens(selector: ':root' | '.dark'): Record<string, string> {
  const block =
    css.match(new RegExp(`^${selector.replace('.', '\\.')} \\{([^}]*)\\}`, 'm'))?.[1] ?? '';
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

// [texto, fondo]
const pairs: Array<[string, string]> = [
  ['foreground', 'background'],
  ['foreground', 'muted'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'muted'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
  ['destructive', 'background'],
  ['brand-text', 'background'],
];

describe.each([
  ['modo claro', tokens(':root')],
  ['modo oscuro', tokens('.dark')],
])('contraste WCAG AA en %s', (_mode, values) => {
  it.each(pairs)('%s sobre %s ≥ 4.5:1', (text, background) => {
    expect(values[text], `falta --${text}`).toBeDefined();
    expect(values[background], `falta --${background}`).toBeDefined();
    expect(contrast(values[text]!, values[background]!)).toBeGreaterThanOrEqual(4.5);
  });
});

it('en modo claro no se usa texto amarillo de marca sobre blanco', () => {
  const light = tokens(':root');
  expect(light['brand-text']).not.toBe(light.primary);
});
