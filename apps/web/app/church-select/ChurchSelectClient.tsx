'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface Church {
  churchId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: string;
}

const ROLE_LABEL: Record<string, string> = {
  pastor_central: 'Pastor Central',
  pastor_auxiliar: 'Pastor Auxiliar',
  lider: 'Líder',
  membro: 'Membro',
};

const STORAGE_KEY = 'edah_active_church_id';

interface Props {
  churches: Church[];
}

export function ChurchSelectClient({ churches }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleSelect(church: Church) {
    setSelected(church.churchId);
    localStorage.setItem(STORAGE_KEY, church.churchId);
    window.location.href = '/dashboard';
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <LogoMark />
          <h1 className={styles.title}>Selecione uma igreja</h1>
          <p className={styles.subtitle}>
            Você faz parte de {churches.length} igrejas. Escolha com qual deseja trabalhar agora.
          </p>
        </div>

        <div className={styles.list}>
          {churches.map((church) => (
            <button
              key={church.churchId}
              className={[styles.card, selected === church.churchId ? styles.cardLoading : ''].filter(Boolean).join(' ')}
              onClick={() => handleSelect(church)}
              disabled={selected !== null}
            >
              <div className={styles.cardAvatar}>
                {church.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={church.logoUrl} alt={church.name} className={styles.cardLogo} />
                ) : (
                  <span className={styles.cardInitial}>{church.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{church.name}</span>
                <span className={styles.cardRole}>{ROLE_LABEL[church.role] ?? church.role}</span>
              </div>
              {selected === church.churchId && (
                <span className={styles.cardSpinner} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ marginBottom: 'var(--space-2)' }}>
      <rect width="28" height="28" rx="6" fill="#2E5FA3" />
      <path d="M8 20V8h5.5c3.6 0 6.5 2.7 6.5 6s-2.9 6-6.5 6H8z" fill="#F0F4FA" />
      <path d="M13 12h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2v-4z" fill="#2E5FA3" />
    </svg>
  );
}
