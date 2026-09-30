import type { SiteContent } from '@tamila/shared';
import { Eyebrow, Logo } from '@tamila/ui';
import { Link } from 'react-router';
import { WhatsAppButton } from '~/features/whatsapp';
import { FacebookIcon, InstagramIcon, TikTokIcon } from './SocialIcons';

export function Footer({ site }: { site: SiteContent }) {
  const { settings, services } = site;
  const socials = [
    { url: settings.instagramUrl, label: 'Instagram', Icon: InstagramIcon },
    { url: settings.facebookUrl, label: 'Facebook', Icon: FacebookIcon },
    { url: settings.tiktokUrl, label: 'TikTok', Icon: TikTokIcon },
  ].filter((s): s is typeof s & { url: string } => Boolean(s.url));

  return (
    <footer className="dark border-t bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-12">
        <div className="flex flex-col gap-4 md:col-span-4">
          <Link to="/" aria-label="TAMILA, ir al inicio" className="self-start">
            <Logo />
          </Link>
          {settings.footerText && (
            <p className="max-w-xs text-sm text-muted-foreground">{settings.footerText}</p>
          )}
        </div>

        <nav aria-label="Servicios" className="md:col-span-4">
          <Eyebrow>Servicios</Eyebrow>
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {services.map((service) => (
              <li key={service.slug}>
                <Link to={`/servicios/${service.slug}`} className="hover:text-brand-text">
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-4 md:col-span-4">
          <Eyebrow>Contacto</Eyebrow>
          <WhatsAppButton
            number={settings.whatsappNumber}
            message={settings.whatsappDefaultMessage}
            className="self-start"
          >
            Escribinos por WhatsApp
          </WhatsAppButton>
          {settings.businessHours && (
            <p className="text-sm text-muted-foreground">{settings.businessHours}</p>
          )}
          {socials.length > 0 && (
            <ul className="flex gap-3" aria-label="Redes sociales">
              {socials.map(({ url, label, Icon }) => (
                <li key={label}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener"
                    aria-label={label}
                    className="flex size-10 items-center justify-center border hover:border-primary hover:text-brand-text"
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} TAMILA. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
