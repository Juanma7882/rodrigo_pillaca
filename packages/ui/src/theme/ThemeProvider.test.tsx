import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { setSystemDark } from '../test/setup';
import { THEME_STORAGE_KEY } from './constants';
import { ThemeProvider } from './ThemeProvider';
import { themeScript } from './theme-script.js';
import { ThemeToggle } from './ThemeToggle';

const renderToggle = () =>
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  );

describe('ThemeProvider', () => {
  it('sin preferencia guardada sigue al sistema (oscuro)', () => {
    setSystemDark(true);
    renderToggle();
    expect(document.documentElement).toHaveClass('dark');
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument();
  });

  it('sin preferencia guardada sigue al sistema (claro)', () => {
    setSystemDark(false);
    renderToggle();
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('la elección manual se guarda y gana sobre el sistema', async () => {
    setSystemDark(true);
    const { unmount } = renderToggle();
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }));
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(document.documentElement).not.toHaveClass('dark');

    unmount();
    renderToggle();
    expect(document.documentElement).not.toHaveClass('dark');
  });
});

describe('themeScript', () => {
  it('aplica la preferencia guardada antes de React', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    new Function(themeScript)();
    expect(document.documentElement).toHaveClass('dark');
  });

  it('sin preferencia usa la del sistema', () => {
    setSystemDark(false);
    new Function(themeScript)();
    expect(document.documentElement).not.toHaveClass('dark');
  });
});
