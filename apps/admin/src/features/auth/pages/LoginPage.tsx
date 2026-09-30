import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@tamila/shared';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  ThemeToggle,
  Turnstile,
} from '@tamila/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { ApiError, login } from '../api/client';
import { useSessionStore } from '../store';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useSessionStore((state) => state.status);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Cada token de Turnstile sirve una sola vez: se remonta el widget después de cada intento.
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (status === 'authenticated') return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(async (values) => {
    if (!turnstileToken) return;
    setFormError(null);
    try {
      await login(values, turnstileToken);
      navigate(from, { replace: true });
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      apiError?.errors?.forEach(({ field, message }) =>
        setError(field as keyof LoginInput, { message }),
      );
      setFormError(apiError?.message ?? 'Ocurrió un error inesperado');
      setTurnstileToken(null);
      setTurnstileKey((key) => key + 1);
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <p className="text-xs font-semibold tracking-[0.3em] text-brand-text uppercase">TAMILA</p>
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>Panel de administración del sitio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Turnstile key={turnstileKey} siteKey={SITE_KEY} onToken={setTurnstileToken} />
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <Button type="submit" disabled={!turnstileToken || isSubmitting}>
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
