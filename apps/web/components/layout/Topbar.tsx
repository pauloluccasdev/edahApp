'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, User, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/nav';
import type { TokenPayload } from '@/lib/auth';
import styles from './Topbar.module.css';

const CHURCH_ROLES = [
  { value: 'pastor_central',  label: 'Pastor Central' },
  { value: 'pastor_auxiliar', label: 'Pastor Auxiliar' },
  { value: 'lider',           label: 'Líder' },
  { value: 'membro',          label: 'Membro' },
];

interface Props {
  session: TokenPayload;
}

export function Topbar({ session }: Props) {
  const pathname = usePathname();
  const [simulatedRole, setSimulatedRole] = useState(session.role);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageTitle =
    [...NAV_ITEMS].reverse().find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href),
    )?.label ?? 'Dashboard';

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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  }

  return (
    <header className={styles.topbar}>

      {/* Mobile: logo + nome do app */}
      <div className={styles.mobileBrand}>
        <LogoMark size={24} />
        <span className={styles.mobileBrandName}>Edah</span>
        {session.churchName && (
          <span className={styles.mobileChurch}>{session.churchName}</span>
        )}
      </div>

      {/* Desktop: título da página */}
      <h1 className={styles.title}>{pageTitle}</h1>

      {/* Suporte */}
      {session.isSuporte && (
        <div className={styles.suporteArea}>
          <span className={styles.suporteBadge}>Suporte</span>
          <select
            className={styles.select}
            defaultValue={session.churchId}
            title="Simular contexto de outra church"
          >
            <option value={session.churchId}>{session.churchName || 'Church atual'}</option>
          </select>
          <select
            className={styles.select}
            value={simulatedRole}
            onChange={(e) => setSimulatedRole(e.target.value)}
            title="Simular papel"
          >
            {CHURCH_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.iconBtn} aria-label="Notificações">
          <Bell size={18} strokeWidth={1.5} />
        </button>

        {/* User menu */}
        <div className={styles.userMenu} ref={menuRef}>
          <button
            className={styles.avatarBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu do usuário"
            aria-expanded={menuOpen}
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
              {/* Header do menu */}
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{session.name}</p>
                <p className={styles.dropdownEmail}>{session.email}</p>
              </div>

              <div className={styles.dropdownDivider} />

              <a
                href="/dashboard/perfil"
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <User size={15} strokeWidth={1.5} />
                Meu perfil
              </a>

              <div className={styles.dropdownDivider} />

              <button
                className={[styles.dropdownItem, styles.dropdownItemDanger].join(' ')}
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={15} strokeWidth={1.5} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

    </header>
  );
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill="#2E5FA3" />
      <path d="M8 20V8h5.5c3.6 0 6.5 2.7 6.5 6s-2.9 6-6.5 6H8z" fill="#F0F4FA" />
      <path d="M13 12h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2v-4z" fill="#2E5FA3" />
    </svg>
  );
}
