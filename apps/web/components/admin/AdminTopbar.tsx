'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

import type { TokenPayload } from '@/lib/auth';
import { ADMIN_NAV_ITEMS } from '@/lib/admin-nav';
import styles from './AdminTopbar.module.css';

interface Props {
  session: TokenPayload;
}

export function AdminTopbar({ session }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageTitle = ADMIN_NAV_ITEMS.find((item) => pathname.startsWith(item.href))?.label ?? 'Suporte';

  const initials = (session.name ?? session.email ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  }

  return (
    <header className={styles.topbar}>
      {/* Mobile: logo + badge */}
      <div className={styles.mobileBrand}>
        <LogoMark className={styles.mobileLogo} />
        <span className={styles.mobileBrandName}>Edah</span>
        <span className={styles.suporteBadge}>Suporte</span>
      </div>

      {/* Desktop: page title */}
      <p className={styles.title}>{pageTitle}</p>

      <div className={styles.userMenu} ref={menuRef}>
        <button
          className={styles.avatarBtn}
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label="Menu do usuário"
        >
          {session.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.avatarUrl} alt={session.name} className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarInitials}>{initials}</span>
          )}
        </button>

        {menuOpen && (
          <div className={styles.dropdown} role="menu">
            <div className={styles.dropdownHeader}>
              <p className={styles.dropdownName}>{session.name}</p>
              <p className={styles.dropdownEmail}>{session.email}</p>
              <span className={styles.dropdownBadge}>Suporte</span>
            </div>
            <hr className={styles.dropdownDivider} />
            <button
              className={[styles.dropdownItem, styles.dropdownItemDanger].join(' ')}
              onClick={handleLogout}
              role="menuitem"
            >
              <LogOut size={15} strokeWidth={1.5} />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill="#2E5FA3" />
      <path d="M8 20V8h5.5c3.6 0 6.5 2.7 6.5 6s-2.9 6-6.5 6H8z" fill="#F0F4FA" />
      <path d="M13 12h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2v-4z" fill="#2E5FA3" />
    </svg>
  );
}
