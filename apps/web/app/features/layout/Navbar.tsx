import type { SiteContent } from '@tamila/shared';
import { cn, Logo, ThemeToggle } from '@tamila/ui';
import { useState } from 'react';
import { Link } from 'react-router';
import { WhatsAppButton } from '~/features/whatsapp';
import { MobileMenu } from './MobileMenu';
import { navItems } from './nav-items';
import { SectionLink } from './SectionLink';
import { useHideOnScroll } from './useHideOnScroll';

export function Navbar({ site }: { site: SiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const hidden = useHideOnScroll(menuOpen || focusWithin);
  const items = navItems(site);

  return (
    <header
      data-hidden={hidden}
      onFocus={() => setFocusWithin(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusWithin(false);
      }}
      className={cn(
        'sticky top-0 z-30 border-b bg-background/95 backdrop-blur transition-transform duration-300 motion-reduce:transition-none',
        hidden && '-translate-y-full',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" aria-label="TAMILA, ir al inicio" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {items.map((item) => (
              <li key={item.id}>
                <SectionLink
                  id={item.id}
                  className="text-xs font-semibold tracking-[0.2em] uppercase transition-colors hover:text-brand-text"
                >
                  {item.label}
                </SectionLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <WhatsAppButton
            number={site.settings.whatsappNumber}
            message={site.settings.whatsappDefaultMessage}
            size="sm"
            className="hidden sm:inline-flex"
          >
            Pedir presupuesto
          </WhatsAppButton>
          <MobileMenu items={items} onOpenChange={setMenuOpen} />
        </div>
      </div>
    </header>
  );
}
