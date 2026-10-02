import { logout, RequireAuth } from '@/features/auth';
import { getSiteUrl } from '@/features/content';
import {
  Button,
  cn,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  ThemeToggle,
} from '@tamila/ui';
import { Ellipsis, ExternalLink, LogOut } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { navItems, type NavItem } from '../nav-items';

const primaryItems = navItems.filter((item) => item.primary);
const secondaryItems = navItems.filter((item) => !item.primary);

/** Panel admin: menú lateral en la compu y barra inferior + "Más" en el celular. */
export function AdminLayout() {
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <RequireAuth>
      <div className="min-h-svh">
        <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="font-black tracking-[0.2em] uppercase">
              TAMILA <span className="text-brand-text">admin</span>
            </span>
            <div className="hidden items-center gap-2 md:flex">
              <SiteLink />
              <ThemeToggle />
              <Button type="button" variant="outline" size="sm" onClick={onLogout}>
                <LogOut aria-hidden /> Cerrar sesión
              </Button>
            </div>
          </div>
        </header>

        <aside className="fixed top-14 bottom-0 left-0 hidden w-56 border-r md:block">
          <nav aria-label="Menú principal" className="flex flex-col gap-1 p-3">
            {navItems.map((item) => (
              <SideLink key={item.to} item={item} />
            ))}
          </nav>
        </aside>

        <main className="px-4 pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-10 md:pl-[calc(14rem+2rem)] md:pr-8">
          <div className="mx-auto max-w-4xl">
            <Outlet />
          </div>
        </main>

        <nav
          aria-label="Secciones"
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <ul className="grid grid-cols-5">
            {primaryItems.map((item) => (
              <li key={item.to}>
                <BottomLink item={item} />
              </li>
            ))}
            <li>
              <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
                <SheetTrigger asChild>
                  <button type="button" className={bottomItemClass(false)}>
                    <Ellipsis aria-hidden className="size-5" />
                    Más
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
                  <SheetHeader>
                    <SheetTitle>Más secciones</SheetTitle>
                    <SheetDescription className="sr-only">
                      Secciones del panel, el sitio público y la sesión
                    </SheetDescription>
                  </SheetHeader>
                  <nav aria-label="Más secciones" className="flex flex-col gap-1 px-4">
                    {secondaryItems.map((item) => (
                      <SideLink key={item.to} item={item} onNavigate={() => setMoreOpen(false)} />
                    ))}
                  </nav>
                  <div className="flex flex-wrap items-center gap-2 border-t p-4">
                    <SiteLink />
                    <ThemeToggle />
                    <Button type="button" variant="outline" onClick={onLogout}>
                      <LogOut aria-hidden /> Cerrar sesión
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </li>
          </ul>
        </nav>
      </div>
    </RequireAuth>
  );
}

function SideLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent',
          isActive && 'bg-accent font-semibold text-brand-text',
        )
      }
    >
      <Icon aria-hidden className="size-4" />
      {item.label}
    </NavLink>
  );
}

const bottomItemClass = (active: boolean) =>
  cn(
    'flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground',
    active && 'font-semibold text-brand-text',
  );

function BottomLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => bottomItemClass(isActive)}
    >
      <Icon aria-hidden className="size-5" />
      {item.label}
    </NavLink>
  );
}

function SiteLink() {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return null;
  return (
    <Button asChild variant="outline" size="sm">
      <a href={siteUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden /> Ver el sitio
      </a>
    </Button>
  );
}
