import { displayFontUrl, Logo, themeScript, ThemeProvider } from '@tamila/ui';
import { useEffect } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router';
import { Footer, Navbar } from '~/features/layout';
import { FloatingWhatsApp, WhatsAppButton } from '~/features/whatsapp';
import { getSite } from '~/shared/api/client.server';
import { siteUrl } from '~/shared/site.server';

import type { Route } from './+types/root';
import './app.css';

export const links: Route.LinksFunction = () => [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  {
    rel: 'preload',
    href: displayFontUrl,
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  },
];

export async function loader() {
  return { site: await getSite(), siteUrl: siteUrl() };
}

// El JS marca <html> con `js` para que las animaciones de entrada solo oculten contenido con JS activo.
const jsFlagScript = "document.documentElement.classList.add('js');";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    // La clase `dark` la aplica el script inline antes de hidratar.
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script dangerouslySetInnerHTML={{ __html: themeScript + jsFlagScript }} />
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
  const { site } = useLoaderData<typeof loader>();
  // Marca que React ya hidrató (los tests e2e lo esperan antes de interactuar).
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true';
  }, []);
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <Navbar site={site} />
      <main id="contenido">
        <Outlet />
      </main>
      <Footer site={site} />
      <FloatingWhatsApp
        number={site.settings.whatsappNumber}
        message={site.settings.whatsappDefaultMessage}
      />
    </>
  );
}

/** Si falla la carga del contenido (API caída), una página amable con contacto directo. */
export function ErrorBoundary() {
  const fallbackNumber = import.meta.env.VITE_WHATSAPP_FALLBACK ?? '';
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="font-display text-3xl font-black uppercase">Estamos con problemas técnicos</h1>
      <p className="text-muted-foreground">
        El sitio no está disponible en este momento. Intentá de nuevo en unos minutos
        {fallbackNumber ? ' o escribinos directamente por WhatsApp.' : '.'}
      </p>
      <WhatsAppButton number={fallbackNumber} message="Hola, quiero hacer una consulta.">
        Escribinos por WhatsApp
      </WhatsAppButton>
    </main>
  );
}
