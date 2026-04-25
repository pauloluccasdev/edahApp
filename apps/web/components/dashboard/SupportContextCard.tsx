'use client';

import { useState } from 'react';
import { ShieldAlert, ChevronDown } from 'lucide-react';
import type { TokenPayload } from '@/lib/auth';
import styles from './SupportContextCard.module.css';

const CHURCH_ROLES = [
  { value: 'pastor_central',  label: 'Pastor Central' },
  { value: 'pastor_auxiliar', label: 'Pastor Auxiliar' },
  { value: 'lider',           label: 'Líder' },
  { value: 'membro',          label: 'Membro' },
];

interface Props {
  session: TokenPayload;
}

export function SupportContextCard({ session }: Props) {
  const [simulatedRole, setSimulatedRole] = useState(session.role);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <ShieldAlert size={14} strokeWidth={2} className={styles.icon} />
        <span className={styles.badge}>Modo Suporte</span>
        <span className={styles.hint}>Simulando contexto</span>
      </div>

      <div className={styles.fields}>
        {/* Church — estático até o endpoint /api/churches estar disponível */}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Igreja</span>
          <div className={styles.selectWrapper}>
            <select className={styles.select} defaultValue={session.churchId} disabled>
              <option value={session.churchId}>{session.churchName || 'Igreja atual'}</option>
            </select>
            <ChevronDown size={13} className={styles.chevron} />
          </div>
        </div>

        {/* Role — funcional no front */}
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Papel</span>
          <div className={styles.selectWrapper}>
            <select
              className={styles.select}
              value={simulatedRole}
              onChange={(e) => setSimulatedRole(e.target.value)}
            >
              {CHURCH_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className={styles.chevron} />
          </div>
        </div>
      </div>
    </div>
  );
}
