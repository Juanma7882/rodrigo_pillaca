import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { NavItem } from './nav-items';
import { twoDigits } from '~/shared/format';
import { SectionLink } from './SectionLink';

type MobileMenuProps = { items: NavItem[]; onOpenChange?: (open: boolean) => void };

/** Menú de navegación para pantallas angostas: foco atrapado, cierre con Escape o al elegir. */
export function MobileMenu({ items, onOpenChange }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggle = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (!next) buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      toggle(false);
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
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => toggle(!open)}
        className="flex size-10 items-center justify-center focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {open ? <X aria-hidden /> : <Menu aria-hidden />}
      </button>
      {open && (
        <div
          id="menu-movil"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          onKeyDown={onKeyDown}
          className="fixed inset-x-0 top-16 bottom-0 z-40 flex flex-col gap-2 overflow-y-auto border-t bg-background px-4 py-8"
        >
          <nav aria-label="Menú móvil">
            <ul className="flex flex-col">
              {items.map((item, index) => (
                <li key={item.id} className="border-b">
                  <SectionLink
                    id={item.id}
                    onNavigate={() => toggle(false)}
                    className="font-display flex items-baseline gap-4 py-5 text-2xl font-extrabold uppercase"
                  >
                    <span className="text-sm text-brand-text">{twoDigits(index + 1)}</span>
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            onClick={() => toggle(false)}
            className="mt-6 self-start text-sm underline"
          >
            Cerrar menú
          </button>
        </div>
      )}
    </div>
  );
}
