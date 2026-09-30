import { Turnstile as CloudflareTurnstile } from '@marsidev/react-turnstile';
import { useTheme } from '../theme/ThemeProvider';

type TurnstileProps = {
  siteKey: string;
  /** Recibe el token cuando el desafío se resuelve, o null si vence o falla. */
  onToken: (token: string | null) => void;
  className?: string;
};

export function Turnstile({ siteKey, onToken, className }: TurnstileProps) {
  const { theme } = useTheme();
  return (
    <CloudflareTurnstile
      className={className}
      siteKey={siteKey}
      options={{ theme, language: 'es' }}
      onSuccess={(token) => onToken(token)}
      onExpire={() => onToken(null)}
      onError={() => onToken(null)}
    />
  );
}
