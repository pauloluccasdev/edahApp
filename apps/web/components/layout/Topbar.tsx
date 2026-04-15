'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
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
  onMenuToggle: () => void;
}

export function Topbar({ session, onMenuToggle }: Props) {
  const pathname = usePathname();
  const [simulatedRole, setSimulatedRole] = useState(session.role);

  // Resolve o título da página a partir do nav config
  const pageTitle =
    [...NAV_ITEMS].reverse().find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href),
    )?.label ?? 'Dashboard';

  return (
    <header className={styles.topbar}>

      {/* Hamburger — mobile only */}
      <button
        className={styles.hamburger}
        onClick={onMenuToggle}
        aria-label="Abrir menu"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {/* Título da página */}
      <h1 className={styles.title}>{pageTitle}</h1>

      {/* Suporte: seletor de church e role */}
      {session.isSuporte && (
        <div className={styles.suporteArea}>
          <span className={styles.suporteBadge}>Suporte</span>

          {/* Church select — integrar com GET /api/churches quando disponível */}
          <select
            className={styles.select}
            defaultValue={session.churchId}
            title="Simular contexto de outra church"
          >
            <option value={session.churchId}>{session.churchName || 'Church atual'}</option>
            {/* Populado via API futuramente */}
          </select>

          <select
            className={styles.select}
            value={simulatedRole}
            onChange={(e) => setSimulatedRole(e.target.value)}
            title="Simular papel"
          >
            {CHURCH_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Ações globais */}
      <div className={styles.actions}>
        <button className={styles.iconBtn} aria-label="Notificações">
          <Bell size={18} strokeWidth={1.5} />
          {/* Badge vermelho — mostrar quando houver notificações não lidas */}
          {/* <span className={styles.badge} /> */}
        </button>
      </div>

    </header>
  );
}
