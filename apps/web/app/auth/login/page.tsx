import type { Metadata } from 'next';
import { LoginForm } from './_components/LoginForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Entrar — Edah',
};

export default function LoginPage() {
  return (
    <main className={styles.root}>

      {/* Painel de branding — visível apenas em desktop (> 1024px) */}
      <div className={styles.branding} aria-hidden="true">
        <div className={styles.brandingInner}>
          <div className={styles.brandingLogo}>
            <LogoIcon size={48} />
            <span className={styles.brandingName}>Edah</span>
          </div>
          <p className={styles.brandingTagline}>
            Gestão de escalas e ministérios para igrejas
          </p>
          <ul className={styles.brandingFeatures}>
            <li>Escalas publicadas com um clique</li>
            <li>Controle de conflitos em tempo real</li>
            <li>Notificações via WhatsApp para os membros</li>
            <li>Registro de presença simplificado</li>
          </ul>
        </div>
      </div>

      {/* Card de login */}
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <LogoIcon size={32} />
            <span className={styles.logoText}>Edah</span>
          </div>
          <p className={styles.subtitle}>Gestão de escalas e ministérios</p>
        </header>

        <LoginForm />
      </div>

    </main>
  );
}

function LogoIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect width="28" height="28" rx="6" fill="#2E5FA3" />
      <path d="M8 20V8h5.5c3.6 0 6.5 2.7 6.5 6s-2.9 6-6.5 6H8z" fill="#F0F4FA" />
      <path d="M13 12h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2v-4z" fill="#2E5FA3" />
    </svg>
  );
}
