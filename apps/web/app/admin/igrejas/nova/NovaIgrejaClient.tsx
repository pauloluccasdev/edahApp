'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

import { toSlug } from '@/lib/slug';
import styles from './NovaIgrejaClient.module.css';

interface FieldErrors {
  name?: string;
  'pastor.name'?: string;
  'pastor.email'?: string;
  'auxiliar.name'?: string;
  'auxiliar.email'?: string;
  _general?: string;
}

export function NovaIgrejaClient() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  const [pastorName, setPastorName] = useState('');
  const [pastorEmail, setPastorEmail] = useState('');

  const [showAuxiliar, setShowAuxiliar] = useState(false);
  const [auxiliarName, setAuxiliarName] = useState('');
  const [auxiliarEmail, setAuxiliarEmail] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSlug(toSlug(name));
  }, [name]);

  function clearError(key: keyof FieldErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const canSubmit = pastorName.trim().length >= 3 && pastorEmail.trim().length > 0 && name.trim().length >= 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setErrors({});
    setLoading(true);

    const body: Record<string, unknown> = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      pastor: { name: pastorName.trim(), email: pastorEmail.trim() },
    };

    if (showAuxiliar && auxiliarName.trim()) {
      body.auxiliar = { name: auxiliarName.trim(), email: auxiliarEmail.trim() };
    }

    try {
      const res = await fetch('/api/admin/churches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        router.push(`/admin/igrejas/${data.id}?created=true`);
        return;
      }

      if (res.status === 409) {
        const msg: string = data?.message ?? '';
        setErrors({ _general: msg || 'Conflito de dados. Verifique os e-mails informados.' });
        return;
      }

      if (res.status === 400) {
        const msgs: string[] = Array.isArray(data?.message) ? data.message : [data?.message ?? 'Dados inválidos.'];
        const fieldErrors: FieldErrors = {};
        for (const m of msgs) {
          if (m.includes('name') && m.includes('pastor')) fieldErrors['pastor.name'] = m;
          else if (m.includes('email') && m.includes('pastor')) fieldErrors['pastor.email'] = m;
          else if (m.includes('name') && m.includes('auxiliar')) fieldErrors['auxiliar.name'] = m;
          else if (m.includes('email') && m.includes('auxiliar')) fieldErrors['auxiliar.email'] = m;
          else if (m.includes('name')) fieldErrors.name = m;
          else fieldErrors._general = m;
        }
        setErrors(fieldErrors);
        return;
      }

      setErrors({ _general: 'Erro ao criar a igreja. Tente novamente.' });
    } catch {
      setErrors({ _general: 'Erro de conexão. Verifique sua rede.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin/igrejas" className={styles.backBtn} aria-label="Voltar para lista de igrejas">
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <div>
          <h1 className={styles.title}>Nova Igreja</h1>
          <p className={styles.subtitle}>Preencha os dados abaixo para cadastrar</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        {/* Dados da Igreja */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dados da Igreja</h2>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Nome <span className={styles.required} aria-hidden="true">*</span>
            </label>
            <input
              id="name"
              className={[styles.input, errors.name ? styles.inputError : ''].filter(Boolean).join(' ')}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); clearError('name'); }}
              placeholder="Ex: Igreja Batista Central"
              autoComplete="off"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-err' : undefined}
            />
            {errors.name && <p id="name-err" className={styles.errorMsg}>{errors.name}</p>}
          </div>

        </section>

        {/* Pastor Central */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Pastor Central <span className={styles.required} aria-hidden="true">*</span>
          </h2>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pastor-name">Nome completo</label>
              <input
                id="pastor-name"
                className={[styles.input, errors['pastor.name'] ? styles.inputError : ''].filter(Boolean).join(' ')}
                type="text"
                value={pastorName}
                onChange={(e) => { setPastorName(e.target.value); clearError('pastor.name'); }}
                placeholder="João Silva"
                autoComplete="name"
                aria-invalid={!!errors['pastor.name']}
                aria-describedby={errors['pastor.name'] ? 'pastor-name-err' : undefined}
              />
              {errors['pastor.name'] && <p id="pastor-name-err" className={styles.errorMsg}>{errors['pastor.name']}</p>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="pastor-email">E-mail</label>
              <input
                id="pastor-email"
                className={[styles.input, errors['pastor.email'] ? styles.inputError : ''].filter(Boolean).join(' ')}
                type="email"
                value={pastorEmail}
                onChange={(e) => { setPastorEmail(e.target.value); clearError('pastor.email'); }}
                placeholder="joao@igreja.com"
                autoComplete="email"
                inputMode="email"
                aria-invalid={!!errors['pastor.email']}
                aria-describedby={errors['pastor.email'] ? 'pastor-email-err' : 'pastor-email-hint'}
              />
              {errors['pastor.email'] ? (
                <p id="pastor-email-err" className={styles.errorMsg}>{errors['pastor.email']}</p>
              ) : (
                <p id="pastor-email-hint" className={styles.hint}>Receberá o convite de acesso.</p>
              )}
            </div>
          </div>
        </section>

        {/* Pastor Auxiliar */}
        <section className={styles.section}>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowAuxiliar((v) => !v)}
            aria-expanded={showAuxiliar}
          >
            {showAuxiliar ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
            {showAuxiliar ? 'Remover Pastor Auxiliar' : 'Adicionar Pastor Auxiliar'}
          </button>

          {showAuxiliar && (
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="auxiliar-name">Nome completo</label>
                <input
                  id="auxiliar-name"
                  className={[styles.input, errors['auxiliar.name'] ? styles.inputError : ''].filter(Boolean).join(' ')}
                  type="text"
                  value={auxiliarName}
                  onChange={(e) => { setAuxiliarName(e.target.value); clearError('auxiliar.name'); }}
                  placeholder="Maria Santos"
                  autoComplete="name"
                  aria-invalid={!!errors['auxiliar.name']}
                />
                {errors['auxiliar.name'] && <p className={styles.errorMsg}>{errors['auxiliar.name']}</p>}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="auxiliar-email">E-mail</label>
                <input
                  id="auxiliar-email"
                  className={[styles.input, errors['auxiliar.email'] ? styles.inputError : ''].filter(Boolean).join(' ')}
                  type="email"
                  value={auxiliarEmail}
                  onChange={(e) => { setAuxiliarEmail(e.target.value); clearError('auxiliar.email'); }}
                  placeholder="maria@igreja.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={!!errors['auxiliar.email']}
                />
                {errors['auxiliar.email'] && <p className={styles.errorMsg}>{errors['auxiliar.email']}</p>}
              </div>
            </div>
          )}
        </section>

        {errors._general && (
          <div className={styles.generalError} role="alert">
            {errors._general}
          </div>
        )}

        <div className={styles.actions}>
          <Link href="/admin/igrejas" className={styles.cancelBtn}>
            Cancelar
          </Link>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={!canSubmit || loading}
            aria-disabled={!canSubmit || loading}
          >
            {loading ? 'Criando...' : 'Criar Igreja'}
          </button>
        </div>
      </form>
    </div>
  );
}
