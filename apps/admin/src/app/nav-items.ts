import {
  CircleHelp,
  Hammer,
  Images,
  LayoutDashboard,
  ListOrdered,
  Settings,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Las principales van en la barra inferior del celular; el resto, en "Más". */
  primary: boolean;
};

export const navItems: NavItem[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, primary: true },
  { to: '/servicios', label: 'Servicios', icon: Wrench, primary: true },
  { to: '/trabajos', label: 'Trabajos', icon: Hammer, primary: true },
  { to: '/imagenes', label: 'Imágenes', icon: Images, primary: true },
  { to: '/configuracion', label: 'Configuración', icon: Settings, primary: false },
  { to: '/como-trabajamos', label: 'Cómo trabajamos', icon: ListOrdered, primary: false },
  { to: '/preguntas', label: 'Preguntas frecuentes', icon: CircleHelp, primary: false },
];
