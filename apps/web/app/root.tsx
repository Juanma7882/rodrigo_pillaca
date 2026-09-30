import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { NotFound, RouteError, themeScript, ThemeProvider } from '@tamila/ui';

import type { Route } from './+types/root';
import './app.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // La clase `dark` la aplica el script inline antes de hidratar.
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <NotFound
        homeLink={
          <Link to="/" className="font-medium text-brand-text underline underline-offset-4">
            Volver al inicio
          </Link>
        }
      />
    );
  }
  if (import.meta.env.DEV && error instanceof Error) console.error(error);
  return <RouteError />;
}
