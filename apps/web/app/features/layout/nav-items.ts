import type { SiteContent } from '@tamila/shared';

export type NavItem = { id: string; label: string };

/** Secciones del inicio que aparecen en la navegación (se omiten las que no tienen contenido). */
export function navItems(site: SiteContent): NavItem[] {
  return [
    { id: 'servicios', label: 'Servicios', show: site.services.length > 0 },
    { id: 'como-trabajamos', label: 'Cómo trabajamos', show: site.processSteps.length > 0 },
    { id: 'trabajos', label: 'Trabajos', show: site.hasProjects },
    { id: 'preguntas', label: 'Preguntas', show: site.faqs.length > 0 },
  ]
    .filter((item) => item.show)
    .map(({ id, label }) => ({ id, label }));
}
