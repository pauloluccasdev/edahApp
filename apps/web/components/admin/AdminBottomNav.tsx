'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';
import styles from './AdminBottomNav.module.css';

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Navegação do painel de suporte">
      {ADMIN_NAV_ITEMS.map(({ href, label, Icon, enabled }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={enabled ? href : '#'}
            className={[
              styles.item,
              isActive ? styles.active : '',
              !enabled ? styles.disabled : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-current={isActive ? 'page' : undefined}
            tabIndex={!enabled ? -1 : undefined}
          >
            <Icon className={styles.icon} size={22} strokeWidth={isActive ? 2 : 1.5} />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
