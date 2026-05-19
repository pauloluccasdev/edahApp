import { Building2, ScrollText, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  enabled: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin/igrejas', label: 'Igrejas',  Icon: Building2,  enabled: true  },
  { href: '/admin/usuarios', label: 'Usuários', Icon: Users,      enabled: false },
  { href: '/admin/logs',     label: 'Logs',     Icon: ScrollText, enabled: false },
];
