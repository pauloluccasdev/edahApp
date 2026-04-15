import {
  LayoutDashboard,
  Calendar,
  Users,
  CheckSquare,
  Music,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
  enabled: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',             label: 'Dashboard',   Icon: LayoutDashboard, exact: true, enabled: true  },
  { href: '/dashboard/escalas',     label: 'Escalas',     Icon: Calendar,                     enabled: false },
  { href: '/dashboard/membros',     label: 'Membros',     Icon: Users,                        enabled: false },
  { href: '/dashboard/presenca',    label: 'Presença',    Icon: CheckSquare,                  enabled: false },
  { href: '/dashboard/ministerios', label: 'Ministérios', Icon: Music,                        enabled: false },
];
