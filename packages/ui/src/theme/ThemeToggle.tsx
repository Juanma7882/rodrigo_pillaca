import { Moon, Sun } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from './ThemeProvider';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={isDark}
    >
      {isDark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
