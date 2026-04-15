'use client';

import { useState } from 'react';
import styles from './LoginForm.module.css';

type FieldError = { email?: string; password?: string; form?: string };

function validate(email: string, password: string): FieldError {
  const errors: FieldError = {};
  if (!email) errors.email = 'E-mail obrigatório';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'E-mail inválido';
  if (!password) errors.password = 'Senha obrigatória';
  return errors;
}

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldError>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(email, password);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors({ form: data.error ?? 'E-mail ou senha incorretos' });
        return;
      }

      window.location.href = '/dashboard';  // redirect pós-login
    } catch {
      setErrors({ form: 'Não foi possível conectar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      {errors.form && (
        <div className={styles.formError} role="alert">
          {errors.form}
        </div>
      )}

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>E-mail</label>
        <input
          id="email"
          type="email"
          className={[styles.input, errors.email ? styles.inputError : ''].join(' ')}
          placeholder="usuario@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
        />
        {errors.email && <span className={styles.fieldError} role="alert">{errors.email}</span>}
      </div>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label htmlFor="password" className={styles.label}>Senha</label>
          <a href="/esqueceu-senha" className={styles.forgotLink}>Esqueceu sua senha?</a>
        </div>
        <div className={styles.passwordWrapper}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className={[styles.input, styles.inputPassword, errors.password ? styles.inputError : ''].join(' ')}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
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
