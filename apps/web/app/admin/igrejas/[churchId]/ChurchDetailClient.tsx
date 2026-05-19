'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Edit2, Mail, Trash2, UserPlus, X } from 'lucide-react';
import Link from 'next/link';

import type { ChurchDetail } from './page';
import styles from './ChurchDetailClient.module.css';

const TIMEZONES = [
  { label: 'Brasília / São Paulo (UTC-3)', value: 'America/Sao_Paulo' },
  { label: 'Manaus (UTC-4)', value: 'America/Manaus' },
  { label: 'Belém (UTC-3)', value: 'America/Belem' },
  { label: 'Fortaleza (UTC-3)', value: 'America/Fortaleza' },
  { label: 'Recife (UTC-3)', value: 'America/Recife' },
  { label: 'Cuiabá (UTC-4)', value: 'America/Cuiaba' },
  { label: 'Porto Velho (UTC-4)', value: 'America/Porto_Velho' },
  { label: 'Rio Branco (UTC-5)', value: 'America/Rio_Branco' },
  { label: 'Fernando de Noronha (UTC-2)', value: 'America/Noronha' },
  { label: 'UTC (UTC+0)', value: 'UTC' },
  { label: 'Lisboa / Portugal (UTC+0/+1)', value: 'Europe/Lisbon' },
  { label: 'Nova York (UTC-5/-4)', value: 'America/New_York' },
  { label: 'Los Angeles (UTC-8/-7)', value: 'America/Los_Angeles' },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

function roleLabel(role: string) {
  return role === 'pastor_central' ? 'Pastor Central' : 'Pastor Auxiliar';
}

interface Props {
  church: ChurchDetail;
  showCreatedBanner: boolean;
  session: { isSuporte: boolean; role: string };
}

interface EditForm {
  name: string;
  timezone: string;
  logoUrl: string;
  auxiliarLimit: string;
}

interface EditErrors {
  name?: string;
  timezone?: string;
  auxiliarLimit?: string;
  _general?: string;
}

interface AddAuxiliarForm {
  name: string;
  email: string;
}

export function ChurchDetailClient({ church, showCreatedBanner, session }: Props) {
  const router = useRouter();

  const canManagePastors = session.isSuporte || session.role === 'pastor_central';

  const [bannerVisible, setBannerVisible] = useState(showCreatedBanner);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<EditErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState<EditForm>({
    name: church.name,
    timezone: church.timezone,
    logoUrl: church.logoUrl ?? '',
    auxiliarLimit: String(church.auxiliarLimit),
  });

  const [localChurch, setLocalChurch] = useState(church);

  // Pastor auxiliar management
  const [showAddAuxiliar, setShowAddAuxiliar] = useState(false);
  const [addForm, setAddForm] = useState<AddAuxiliarForm>({ name: '', email: '' });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const pastorCentral = localChurch.pastors.find((p) => p.role === 'pastor_central');
  const auxiliares = localChurch.pastors.filter((p) => p.role === 'pastor_auxiliar');
  const canAddAuxiliar = canManagePastors && auxiliares.length < localChurch.auxiliarLimit;

  function startEdit() {
    setForm({
      name: localChurch.name,
      timezone: localChurch.timezone,
      logoUrl: localChurch.logoUrl ?? '',
      auxiliarLimit: String(localChurch.auxiliarLimit),
    });
    setSaveError({});
    setSaveSuccess(false);
    setEditing(true);
  }

  async function handleAddAuxiliar(e: React.FormEvent) {
    e.preventDefault();
    if (addLoading) return;
    setAddError('');
    setAddLoading(true);
    try {
      const res = await fetch(`/api/admin/churches/${localChurch.id}/pastors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addForm.name.trim(), email: addForm.email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 201) {
        setLocalChurch((prev) => ({ ...prev, pastors: [...prev.pastors, data] }));
        setAddForm({ name: '', email: '' });
        setShowAddAuxiliar(false);
        return;
      }
      setAddError(data?.message ?? 'Erro ao adicionar pastor auxiliar.');
    } catch {
      setAddError('Erro de conexão. Verifique sua rede.');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveAuxiliar(userId: string, name: string) {
    if (!window.confirm(`Remover ${name} como Pastor Auxiliar? O acesso será revogado.`)) return;
    setRemovingId(userId);
    try {
      const res = await fetch(`/api/admin/churches/${localChurch.id}/pastors/${userId}`, {
        method: 'DELETE',
      });
      if (res.status === 204) {
        setLocalChurch((prev) => ({
          ...prev,
          pastors: prev.pastors.filter((p) => p.id !== userId),
        }));
        return;
      }
      const data = await res.json().catch(() => ({}));
      alert(data?.message ?? 'Erro ao remover pastor auxiliar.');
    } catch {
      alert('Erro de conexão. Verifique sua rede.');
    } finally {
      setRemovingId(null);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError({});
  }

  function clearEditError(key: keyof EditErrors) {
    setSaveError((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setSaveError({});
    setSaveSuccess(false);
    setSaving(true);

    const body: Record<string, unknown> = {};
    if (form.name.trim() !== localChurch.name) body.name = form.name.trim();
    if (form.timezone !== localChurch.timezone) body.timezone = form.timezone;
    if (form.logoUrl.trim() !== (localChurch.logoUrl ?? '')) body.logoUrl = form.logoUrl.trim() || '';
    if (session.isSuporte) {
      const limitVal = parseInt(form.auxiliarLimit, 10);
      if (!isNaN(limitVal) && limitVal >= 1 && limitVal !== localChurch.auxiliarLimit) {
        body.auxiliarLimit = limitVal;
      }
    }

    if (Object.keys(body).length === 0) {
      setEditing(false);
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/churches/${localChurch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setLocalChurch((prev) => ({
          ...prev,
          name: (body.name as string) ?? prev.name,
          timezone: (body.timezone as string) ?? prev.timezone,
          logoUrl: body.logoUrl !== undefined ? ((body.logoUrl as string) || null) : prev.logoUrl,
          auxiliarLimit: body.auxiliarLimit !== undefined ? (body.auxiliarLimit as number) : prev.auxiliarLimit,
        }));
        setSaveSuccess(true);
        setEditing(false);
        setTimeout(() => setSaveSuccess(false), 4000);
        return;
      }

      if (res.status === 409) {
        const msg: string = data?.message ?? '';
        setSaveError({ _general: msg || 'Conflito de dados.' });
        return;
      }

      setSaveError({ _general: data?.message ?? 'Erro ao salvar. Tente novamente.' });
    } catch {
      setSaveError({ _general: 'Erro de conexão. Verifique sua rede.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Nav header */}
      <div className={styles.navHeader}>
        <Link href="/admin/igrejas" className={styles.backBtn} aria-label="Voltar">
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <span className={styles.breadcrumb}>Igrejas</span>
      </div>

      {/* Created banner (FE-02.6) */}
      {bannerVisible && (
        <div className={styles.createdBanner} role="status">
          <div className={styles.bannerContent}>
            <Mail size={18} strokeWidth={1.5} className={styles.bannerIcon} />
            <div>
              <p className={styles.bannerTitle}>Igreja criada com sucesso!</p>
              <p className={styles.bannerText}>
                E-mails de definição de senha enviados para{' '}
                <strong>{pastorCentral?.email}</strong>
                {auxiliares[0] && (
                  <> e <strong>{auxiliares[0].email}</strong></>
                )}
                . O link expira em 72 horas.
              </p>
            </div>
          </div>
          <button
            className={styles.bannerClose}
            onClick={() => setBannerVisible(false)}
            aria-label="Fechar notificação"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Save success toast */}
      {saveSuccess && (
        <div className={styles.successToast} role="status" aria-live="polite">
          Igreja atualizada com sucesso.
        </div>
      )}

      {/* Church header */}
      <div className={styles.churchHeader}>
        <div className={styles.churchIconWrap} aria-hidden="true">
          {localChurch.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={localChurch.logoUrl} alt="" className={styles.churchLogo} />
          ) : (
            <Building2 size={28} strokeWidth={1.5} />
          )}
        </div>
        <div className={styles.churchMeta}>
          <h1 className={styles.churchName}>{localChurch.name}</h1>
        </div>
        {!editing && (
          <button className={styles.editBtn} onClick={startEdit} aria-label="Editar esta igreja">
            <Edit2 size={15} strokeWidth={2} />
            <span>Editar</span>
          </button>
        )}
      </div>

      {editing ? (
        /* ---- Edit Form (FE-02.5) ---- */
        <form onSubmit={handleSave} noValidate className={styles.editForm}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Editar dados</h2>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="edit-name">Nome</label>
              <input
                id="edit-name"
                className={[styles.input, saveError.name ? styles.inputError : ''].filter(Boolean).join(' ')}
                type="text"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); clearEditError('name'); }}
                aria-invalid={!!saveError.name}
              />
              {saveError.name && <p className={styles.errorMsg}>{saveError.name}</p>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="edit-timezone">Fuso horário</label>
              <select
                id="edit-timezone"
                className={styles.select}
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="edit-logo">URL do Logo</label>
              <input
                id="edit-logo"
                className={styles.input}
                type="url"
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                placeholder="https://..."
                inputMode="url"
              />
              <p className={styles.hint}>URL pública da imagem do logo.</p>
            </div>

            {session.isSuporte && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="edit-auxiliar-limit">
                  Limite de Pastores Auxiliares
                </label>
                <input
                  id="edit-auxiliar-limit"
                  className={styles.input}
                  type="number"
                  min={1}
                  max={10}
                  value={form.auxiliarLimit}
                  onChange={(e) => setForm((f) => ({ ...f, auxiliarLimit: e.target.value }))}
                />
                <p className={styles.hint}>Plano comercial — máximo de auxiliares permitidos.</p>
                {saveError.auxiliarLimit && <p className={styles.errorMsg}>{saveError.auxiliarLimit}</p>}
              </div>
            )}

            {saveError._general && (
              <div className={styles.generalError} role="alert">{saveError._general}</div>
            )}
          </section>

          <div className={styles.editActions}>
            <button type="button" className={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      ) : (
        /* ---- View Mode (FE-02.4) ---- */
        <>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Informações</h2>
            <dl className={styles.infoList}>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Nome</dt>
                <dd className={styles.infoValue}>{localChurch.name}</dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Fuso horário</dt>
                <dd className={styles.infoValue}>
                  {TIMEZONES.find((t) => t.value === localChurch.timezone)?.label ?? localChurch.timezone}
                </dd>
              </div>
              <div className={styles.infoRow}>
                <dt className={styles.infoLabel}>Cadastrada em</dt>
                <dd className={styles.infoValue}>{formatDate(localChurch.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Pastores</h2>
            <div className={styles.pastorList}>
              {pastorCentral && (
                <div className={styles.pastorCard}>
                  <div className={styles.pastorAvatar} aria-hidden="true">
                    {pastorCentral.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.pastorInfo}>
                    <p className={styles.pastorName}>{pastorCentral.name}</p>
                    <p className={styles.pastorEmail}>{pastorCentral.email}</p>
                  </div>
                  <span className={styles.pastorRole}>Pastor Central</span>
                </div>
              )}

              {auxiliares.map((aux) => (
                <div key={aux.id} className={styles.pastorCard}>
                  <div className={styles.pastorAvatar} aria-hidden="true">
                    {aux.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.pastorInfo}>
                    <p className={styles.pastorName}>{aux.name}</p>
                    <p className={styles.pastorEmail}>{aux.email}</p>
                  </div>
                  <span className={styles.pastorRole}>Pastor Auxiliar</span>
                  {canManagePastors && (
                    <button
                      className={styles.removePastorBtn}
                      onClick={() => handleRemoveAuxiliar(aux.id, aux.name)}
                      disabled={removingId === aux.id}
                      aria-label={`Remover ${aux.name}`}
                      title="Remover Pastor Auxiliar"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  )}
                </div>
              ))}

              {canAddAuxiliar && !showAddAuxiliar && (
                <button
                  className={styles.addAuxiliarBtn}
                  onClick={() => { setShowAddAuxiliar(true); setAddError(''); }}
                >
                  <UserPlus size={15} strokeWidth={2} />
                  Adicionar Pastor Auxiliar
                </button>
              )}

              {showAddAuxiliar && (
                <form className={styles.addAuxiliarForm} onSubmit={handleAddAuxiliar} noValidate>
                  <div className={styles.addAuxiliarFields}>
                    <input
                      className={styles.input}
                      type="text"
                      placeholder="Nome completo"
                      value={addForm.name}
                      onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                      autoComplete="name"
                      required
                    />
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="E-mail"
                      value={addForm.email}
                      onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                      autoComplete="email"
                      inputMode="email"
                      required
                    />
                  </div>
                  {addError && <p className={styles.errorMsg} role="alert">{addError}</p>}
                  <div className={styles.addAuxiliarActions}>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => { setShowAddAuxiliar(false); setAddForm({ name: '', email: '' }); setAddError(''); }}
                      disabled={addLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className={styles.saveBtn}
                      disabled={addLoading || addForm.name.trim().length < 3 || !addForm.email.trim()}
                    >
                      {addLoading ? 'Convidando...' : 'Convidar'}
                    </button>
                  </div>
                </form>
              )}

              {!canAddAuxiliar && canManagePastors && auxiliares.length >= localChurch.auxiliarLimit && (
                <p className={styles.limitReachedMsg}>
                  Limite de {localChurch.auxiliarLimit} pastor{localChurch.auxiliarLimit !== 1 ? 'es' : ''} auxiliar{localChurch.auxiliarLimit !== 1 ? 'es' : ''} atingido.
                  {!session.isSuporte && ' Entre em contato com o Suporte para aumentar o limite.'}
                </p>
              )}
            </div>
          </section>

          {/* Ações futuras (placeholder) */}
          <section className={[styles.section, styles.sectionFuture].join(' ')}>
            <h2 className={styles.sectionTitle}>Ações administrativas</h2>
            <p className={styles.futureText}>
              Funcionalidades como transferência de posse e desativação da igreja estarão disponíveis em breve.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
