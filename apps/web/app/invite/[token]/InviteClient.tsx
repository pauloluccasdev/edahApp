'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

type InviteStatus = 'loading' | 'valid' | 'expired' | 'used' | 'not_found' | 'error';

interface InviteInfo {
  email: string;
  role: string;
  churchName: string;
}

const ROLE_LABEL: Record<string, string> = {
  lider: 'Líder',
  membro: 'Membro',
};

type FieldError = { name?: string; password?: string; form?: string };

function validate(name: string, password: string): FieldError {
  const errors: FieldError = {};
  if (!name || name.trim().length < 2) errors.name = 'Nome deve ter pelo menos 2 caracteres';
  if (!password || password.length < 8) errors.password = 'Senha deve ter pelo menos 8 caracteres';
  return errors;
}

interface Props {
  token: string;
}

export function InviteClient({ token }: Props) {
  const [status, setStatus] = useState<InviteStatus>('loading');
  const [info, setInfo] = useState<InviteInfo | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        if (res.ok) {
          setInfo(await res.json());
          setStatus('valid');
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (res.status === 410 && data.expired) setStatus('expired');
        else if (res.status === 409) setStatus('used');
        else if (res.status === 404) setStatus('not_found');
        else setStatus('error');
      } catch {
        setStatus('error');
      }
    }
    void validateToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(name, password);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 410 && data.expired) {
          setStatus('expired');
          return;
        }
        if (res.status === 409) {
          setStatus('used');
          return;
        }
        setErrors({ form: data.message ?? 'Ocorreu um erro. Tente novamente.' });
        return;
      }

      window.location.href = '/church-select';
    } catch {
      setErrors({ form: 'Não foi possível conectar. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <LogoMark />

        {status === 'loading' && (
          <div className={styles.stateBox}>
            <span className={styles.spinner} aria-label="Carregando..." />
            <p className={styles.stateText}>Verificando convite...</p>
          </div>
        )}

        {status === 'expired' && (
          <div className={[styles.stateBox, styles.stateWarning].join(' ')}>
            <p className={styles.stateTitle}>Convite expirado</p>
            <p className={styles.stateText}>
              Este convite não é mais válido. Peça ao responsável para reenviar o convite.
            </p>
          </div>
        )}

        {status === 'used' && (
          <div className={[styles.stateBox, styles.stateWarning].join(' ')}>
            <p className={styles.stateTitle}>Convite já utilizado</p>
            <p className={styles.stateText}>
              Este convite já foi aceito. Se você já tem uma conta,{' '}
              <a href="/auth/login" className={styles.link}>faça login</a>.
            </p>
          </div>
        )}

        {status === 'not_found' && (
          <div className={[styles.stateBox, styles.stateDanger].join(' ')}>
            <p className={styles.stateTitle}>Convite não encontrado</p>
            <p className={styles.stateText}>
              O link pode estar incorreto. Verifique o e-mail de convite e tente novamente.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className={[styles.stateBox, styles.stateDanger].join(' ')}>
            <p className={styles.stateTitle}>Erro ao verificar convite</p>
            <p className={styles.stateText}>
              Não conseguimos verificar este convite. Tente novamente em instantes.
            </p>
          </div>
        )}

        {status === 'valid' && info && (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>Você foi convidado!</h1>
              <p className={styles.subtitle}>
                <strong>{info.churchName}</strong> convidou <strong>{info.email}</strong> como{' '}
                <strong>{ROLE_LABEL[info.role] ?? info.role}</strong>.
              </p>
              <p className={styles.subtitle}>Crie sua conta para aceitar o convite.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className={styles.form}>
              {errors.form && (
                <div className={styles.formError} role="alert">{errors.form}</div>
              )}

              <div className={styles.field}>
                <label htmlFor="name" className={styles.label}>Seu nome</label>
                <input
                  id="name"
                  type="text"
                  className={[styles.input, errors.name ? styles.inputError : ''].filter(Boolean).join(' ')}
                  placeholder="Como você quer ser chamado"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
                {errors.name && <span className={styles.fieldError} role="alert">{errors.name}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="password" className={styles.label}>Senha</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className={[styles.input, styles.inputPassword, errors.password ? styles.inputError : ''].filter(Boolean).join(' ')}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.password && <span className={styles.fieldError} role="alert">{errors.password}</span>}
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={submitting}
                aria-busy={submitting}
              >
                {submitting && <span className={styles.btnSpinner} aria-hidden="true" />}
                {submitting ? 'Criando conta...' : 'Aceitar convite'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <svg width="40" height="40" viewBox="0 0 28 28" fill="none" aria-hidden="true" className={styles.logo}>
      <rect width="28" height="28" rx="6" fill="#2E5FA3" />
      <path d="M8 20V8h5.5c3.6 0 6.5 2.7 6.5 6s-2.9 6-6.5 6H8z" fill="#F0F4FA" />
      <path d="M13 12h2c1.1 0 2 .9 2 2s-.9 2-2 2h-2v-4z" fill="#2E5FA3" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
