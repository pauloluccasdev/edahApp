'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './AddMemberForm.module.css';

interface Props {
  churchId: string;
  userRole: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type RoleOption = { value: string; label: string };

function getRoleOptions(userRole: string): RoleOption[] {
  if (userRole === 'lider') {
    return [{ value: 'membro', label: 'Membro' }];
  }
  return [
    { value: 'lider', label: 'Líder' },
    { value: 'membro', label: 'Membro' },
  ];
}

type FieldError = { email?: string; role?: string; form?: string };

function validate(email: string, role: string): FieldError {
  const errors: FieldError = {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'E-mail inválido';
  if (!role) errors.role = 'Selecione um papel';
  return errors;
}

export function AddMemberForm({ churchId, userRole, onSuccess, onCancel }: Props) {
  const roleOptions = getRoleOptions(userRole);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState(roleOptions[0]?.value ?? '');
  const [departmentId, setDepartmentId] = useState('');
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  const needsDepartment = role === 'lider';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate(email, role);
    if (needsDepartment && !departmentId.trim()) {
      fieldErrors.role = 'ID do Ministério é obrigatório para o papel de Líder';
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setConflictMsg(null);
    setSubmitting(true);
    try {
      const body: Record<string, string> = { email: email.trim(), role };
      if (needsDepartment && departmentId.trim()) body.departmentId = departmentId.trim();

      const res = await fetch(`/api/churches/${churchId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSuccess();
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        setConflictMsg(data.message ?? 'Já existe um vínculo ou convite pendente para este e-mail.');
        return;
      }

      setErrors({ form: data.message ?? 'Ocorreu um erro. Tente novamente.' });
    } catch {
      setErrors({ form: 'Erro de conexão. Tente novamente.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Convidar membro</h2>
        <button className={styles.closeBtn} onClick={onCancel} aria-label="Fechar">
          <X size={16} strokeWidth={2} />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {errors.form && (
          <div className={styles.formError} role="alert">{errors.form}</div>
        )}

        {conflictMsg && (
          <div className={styles.conflictMsg} role="alert">
            <p>{conflictMsg}</p>
          </div>
        )}

        <div className={styles.fields}>
          <div className={styles.field}>
            <label htmlFor="invite-email" className={styles.label}>E-mail</label>
            <input
              id="invite-email"
              type="email"
              className={[styles.input, errors.email ? styles.inputError : ''].filter(Boolean).join(' ')}
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            {errors.email && <span className={styles.fieldError} role="alert">{errors.email}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="invite-role" className={styles.label}>Papel</label>
            <select
              id="invite-role"
              className={[styles.select, errors.role ? styles.inputError : ''].filter(Boolean).join(' ')}
              value={role}
              onChange={(e) => { setRole(e.target.value); setDepartmentId(''); }}
              disabled={roleOptions.length === 1}
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.role && <span className={styles.fieldError} role="alert">{errors.role}</span>}
          </div>
        </div>

        {needsDepartment && (
          <div className={styles.field}>
            <label htmlFor="invite-dept" className={styles.label}>
              ID do Ministério <span className={styles.required}>*obrigatório para Líder</span>
            </label>
            <input
              id="invite-dept"
              type="text"
              className={styles.input}
              placeholder="UUID do ministério"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className={styles.submitBtn} disabled={submitting} aria-busy={submitting}>
            {submitting && <span className={styles.spinner} aria-hidden="true" />}
            {submitting ? 'Enviando...' : 'Enviar convite'}
          </button>
        </div>
      </form>
    </div>
  );
}
