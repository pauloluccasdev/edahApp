'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/nav';
import type { TokenPayload } from '@/lib/auth';
import styles from './Sidebar.module.css';

interface Props {
  session: TokenPayload;
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ session, collapsed, mobileOpen, onClose }: Props) {
  const pathname = usePathname();

  const initials = (session.name ?? session.email ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  }

  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    mobileOpen ? styles.mobileOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={sidebarClass} aria-label="Navegação principal">

      {/* Logo */}
      <div className={styles.logoRow}>
        <LogoMark className={styles.logoMark} />
        <span className={styles.logoText}>Edah</span>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.filter((item) => item.enabled).map(({ href, label, Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[styles.navItem, isActive ? styles.active : ''].filter(Boolean).join(' ')}
              onClick={onClose}
              title={collapsed ? label : undefined}
            >
              <Icon className={styles.navIcon} size={20} strokeWidth={1.5} />
              <span className={styles.navLabel}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className={styles.userSection}>
        <div className={styles.userRow}>
          {session.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.avatarUrl} alt={session.name} className={styles.avatar} />
          ) : (
            <div className={styles.avatar}>{initials}</div>
          )}
          <div className={styles.userInfo}>
            <p className={styles.userName}>{session.name}</p>
            <p className={styles.userEmail}>{session.email}</p>
          </div>
        </div>

        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={16} strokeWidth={1.5} />
          <span className={styles.logoutLabel}>Sair</span>
        </button>
      </div>

    </aside>
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
