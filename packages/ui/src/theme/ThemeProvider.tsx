import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { THEME_STORAGE_KEY, type Theme } from './constants';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const DARK_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/** Tema efectivo: la elección guardada o, si no hay, la preferencia del sistema. */
function getSnapshot(): Theme {
  return readStored() ?? (window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light');
}

// En SSR no se conoce la preferencia: el script inline del <head> ya aplicó la clase correcta.
function getServerSnapshot(): Theme {
  return 'light';
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  listeners.add(onChange);
  media.addEventListener('change', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener('change', onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Sin storage (modo privado): se aplica igual durante la visita.
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
    listeners.forEach((notify) => notify());
  }, []);

  const toggleTheme = useCallback(
    () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    [setTheme, theme],
  );

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return context;
}
