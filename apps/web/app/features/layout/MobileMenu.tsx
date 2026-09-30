import { Logo } from '@tamila/ui';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { twoDigits } from '~/shared/format';
import type { NavItem } from './nav-items';
import { SectionLink } from './SectionLink';

/**
 * Menú para pantallas angostas: modal con panel lateral sobre un fondo oscurecido.
 * No desplaza la página; se cierra al elegir, con Escape o tocando el fondo. Foco atrapado.
 */
export function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    // Bloquea el scroll de fondo sin cambiar el ancho (evita el salto por la barra de scroll).
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>('a, button');
    if (!focusables?.length) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="menu-movil"
        aria-label="Abrir menú"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <Menu aria-hidden />
      </button>
      {/* Portal en <body>: el backdrop-blur de la barra crearía un contenedor para los `fixed`
          y el modal quedaría encerrado en la altura del header. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              aria-hidden
              data-testid="menu-fondo"
              onClick={close}
              className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            />
            <div
              id="menu-movil"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menú"
              onKeyDown={onKeyDown}
              className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col overflow-y-auto border-l bg-background px-6 pb-8 shadow-2xl"
            >
              <div className="flex h-16 shrink-0 items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={close}
                  aria-label="Cerrar menú"
                  className="-mr-2 flex size-10 items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X aria-hidden />
                </button>
              </div>
              <nav aria-label="Menú móvil" className="mt-6">
                <ul className="flex flex-col">
                  {items.map((item, index) => (
                    <li key={item.id} className="border-b">
                      <SectionLink
                        id={item.id}
                        onNavigate={() => setOpen(false)}
                        className="font-display flex items-baseline gap-4 py-5 text-2xl font-extrabold uppercase"
                      >
                        <span className="text-sm text-brand-text">{twoDigits(index + 1)}</span>
                        {item.label}
                      </SectionLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
