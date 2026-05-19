'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';
import type { TokenPayload } from '@/lib/auth';
import styles from './BottomNav.module.css';

interface Props {
  session: TokenPayload;
}

export function BottomNav({ session }: Props) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => !item.suporteOnly || session.isSuporte);

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {visibleItems.map(({ href, label, Icon, exact, enabled }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={enabled ? href : '#'}
            className={[
              styles.item,
              isActive ? styles.active : '',
              !enabled ? styles.disabled : '',
            ].filter(Boolean).join(' ')}
            aria-current={isActive ? 'page' : undefined}
            tabIndex={!enabled ? -1 : undefined}
          >
            <Icon
              className={styles.icon}
              size={22}
              strokeWidth={isActive ? 2 : 1.5}
            />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
