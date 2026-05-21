import {
  Building2,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  Music,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
  enabled: boolean;
  suporteOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',             label: 'Dashboard',   Icon: LayoutDashboard, exact: true, enabled: true  },
  { href: '/dashboard/escalas',     label: 'Escalas',     Icon: Calendar,                     enabled: false },
  { href: '/dashboard/membros',     label: 'Membros',     Icon: Users,                        enabled: true  },
  { href: '/dashboard/presenca',    label: 'Presença',    Icon: CheckSquare,                  enabled: false },
  { href: '/dashboard/ministerios', label: 'Ministérios', Icon: Music,                        enabled: false },
  { href: '/admin/igrejas',         label: 'Igrejas',     Icon: Building2,                    enabled: true, suporteOnly: true },
];
