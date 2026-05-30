'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CircleCheck,
  Clock,
  FileText,
  Lock,
} from 'lucide-react';
import type { TokenPayload } from '@/lib/auth';
import { useChurch } from '@/lib/church-context';
import styles from './CamposEscalaClient.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleContext {
  id: string;
  scheduleInfo: string | null;
  ministerId: string | null;
  minister: { id: string; name: string } | null;
  event: { id: string; title: string; startsAt: string };
  department: { id: string; name: string; template: string };
}

interface FieldEntry {
  fieldId: string;
  label: string;
  order: number;
  value: string | null;
  filledBy: { id: string; name: string } | null;
  filledAt: string | null;
}

interface Props {
  scheduleId: string;
  session: TokenPayload | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TEMPLATE_LABEL: Record<string, string> = {
  louvor:           'Louvor',
  gc:               'Grupos de Célula',
  midia:            'Mídia',
  discipulado:      'Discipulado',
  adolescentes:     'Adolescentes',
  danca:            'Dança',
  cronograma_culto: 'Cronograma do Culto',
  personalizado:    'Personalizado',
};

const TEMPLATE_COLOR: Record<string, string> = {
  louvor:           'var(--ministry-louvor)',
  gc:               'var(--ministry-gc)',
  midia:            'var(--ministry-midia)',
  discipulado:      'var(--ministry-disc)',
  adolescentes:     'var(--ministry-adol)',
  danca:            'var(--ministry-danca)',
  cronograma_culto: 'var(--ministry-cron)',
  personalizado:    'var(--color-text-secondary)',
};

const FIXED_FIELDS: Partial<Record<string, string[]>> = {
  danca: ['Figurino'],
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CamposEscalaClient({ scheduleId, session }: Props) {
  const router = useRouter();
  const { activeChurch } = useChurch();
  const churchId = activeChurch?.churchId;

  const [schedule, setSchedule]       = useState<ScheduleContext | null>(null);
  const [fields, setFields]           = useState<FieldEntry[]>([]);
  const [values, setValues]           = useState<Record<string, string>>({});
  const [loadError, setLoadError]     = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAdmin =
    session?.isSuporte ||
    session?.role === 'pastor_central' ||
    session?.role === 'pastor_auxiliar';

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    setLoadError(null);
    setFieldsError(null);
    try {
      const [schedRes, fieldsRes] = await Promise.all([
        fetch(`/api/churches/${churchId}/schedules/${scheduleId}`),
        fetch(`/api/churches/${churchId}/schedules/${scheduleId}/fields`),
      ]);

      if (!schedRes.ok) {
        setLoadError(
          schedRes.status === 404
            ? 'Escala não encontrada.'
            : 'Sem permissão para acessar esta escala.',
        );
        return;
      }

      const schedData: ScheduleContext = await schedRes.json();
      setSchedule(schedData);

      if (fieldsRes.ok) {
        const fieldsData: FieldEntry[] = await fieldsRes.json();
        setFields(fieldsData);
        const initial: Record<string, string> = {};
        for (const f of fieldsData) {
          initial[f.fieldId] = f.value ?? '';
        }
        setValues(initial);
      } else if (fieldsRes.status === 403) {
        setFieldsError('forbidden');
      }
    } catch {
      setLoadError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [churchId, scheduleId]);

  useEffect(() => { void load(); }, [load]);

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!churchId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const payload = fields
        .filter((f) => (values[f.fieldId] ?? '').trim().length > 0)
        .map((f) => ({
          departmentFieldId: f.fieldId,
          value: (values[f.fieldId] ?? '').trim(),
        }));

      const res = await fetch(`/api/churches/${churchId}/schedules/${scheduleId}/fields`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: payload }),
      });

      if (res.ok) {
        setSaved(true);
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaved(false), 3000);
        void load();
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveError((data as { message?: string }).message ?? 'Erro ao salvar campos.');
      }
    } catch {
      setSaveError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={styles.centered}>
        <span className={styles.spinner} aria-label="Carregando..." />
      </div>
    );
  }

  if (loadError || !schedule) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>{loadError ?? 'Escala não encontrada.'}</p>
      </div>
    );
  }

  const isMinister = session?.sub === schedule.ministerId;
  const canEdit    = isMinister;
  const isObserver = !canEdit && (isAdmin || session?.role === 'lider');

  const templateColor = TEMPLATE_COLOR[schedule.department.template] ?? 'var(--color-text-secondary)';
  const templateLabel = TEMPLATE_LABEL[schedule.department.template] ?? schedule.department.template;
  const fixedLabels   = new Set(FIXED_FIELDS[schedule.department.template] ?? []);

  const fixedFields  = fields.filter((f) => fixedLabels.has(f.label));
  const customFields = fields.filter((f) => !fixedLabels.has(f.label));

  const hasChanges = fields.some((f) => {
    const current  = (values[f.fieldId] ?? '').trim();
    const original = (f.value ?? '').trim();
    return current !== original;
  });

  const filledCount  = fields.filter((f) => f.value).length;
  const totalCount   = fields.length;
  const progressPct  = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
  const allFilled    = filledCount === totalCount && totalCount > 0;
  const ministerName = schedule.minister?.name ?? null;

  return (
    <div className={styles.root}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <div className={styles.navBar}>
        <button
          className={styles.backBtn}
          onClick={() => router.push(`/dashboard/ministerios/${schedule.department.id}`)}
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          {schedule.department.name}
        </button>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className={styles.hero} style={{ borderLeftColor: templateColor }}>
        <div className={styles.heroMain}>
          <div className={styles.heroTitle}>
            <Calendar size={16} strokeWidth={1.75} style={{ color: templateColor, flexShrink: 0 }} />
            <h1 className={styles.eventTitle}>{schedule.event.title}</h1>
          </div>
          <span className={styles.eventDate}>{fmtDate(schedule.event.startsAt)}</span>
          <span className={styles.templateBadge} style={{ color: templateColor }}>
            {templateLabel} · {schedule.department.name}
          </span>
          {schedule.scheduleInfo && (
            <p className={styles.scheduleInfo}>{schedule.scheduleInfo}</p>
          )}
        </div>

        {schedule.minister && (
          <div className={styles.ministerChip}>
            <div className={styles.avatar}>{initials(schedule.minister.name)}</div>
            <div>
              <span className={styles.ministerRole}>Ministro Responsável</span>
              <span className={styles.ministerName}>{schedule.minister.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Access forbidden ─────────────────────────────────────────────── */}
      {fieldsError === 'forbidden' && (
        <div className={styles.forbiddenCard}>
          <Lock size={20} strokeWidth={1.5} />
          <p>
            Somente o Ministro Responsável, o líder do ministério e os pastores podem
            acessar os campos desta escala.
          </p>
        </div>
      )}

      {/* ── No fields configured ─────────────────────────────────────────── */}
      {!fieldsError && fields.length === 0 && (
        <div className={styles.emptyCard}>
          <FileText size={20} strokeWidth={1.5} />
          <p>Nenhum campo configurado para este ministério.</p>
        </div>
      )}

      {/* ── Progress summary (leader / observer view) ─────────────────────── */}
      {!fieldsError && fields.length > 0 && isObserver && (
        <div className={`${styles.progressCard} ${allFilled ? styles.progressCardDone : ''}`}>
          <div className={styles.progressHeader}>
            {allFilled ? (
              <CircleCheck size={15} strokeWidth={1.75} className={styles.progressIconDone} />
            ) : (
              <Clock size={15} strokeWidth={1.75} className={styles.progressIconPending} />
            )}
            <span className={styles.progressLabel}>
              {allFilled
                ? 'Todos os campos preenchidos'
                : `${filledCount} de ${totalCount} campo${totalCount !== 1 ? 's' : ''} preenchido${filledCount !== 1 ? 's' : ''}`}
            </span>
          </div>
          {!allFilled && (
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Fixed fields ─────────────────────────────────────────────────── */}
      {!fieldsError && fixedFields.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Campos do template</h2>
          <div className={styles.fieldList}>
            {fixedFields.map((f) => (
              <FieldItem
                key={f.fieldId}
                field={f}
                value={values[f.fieldId] ?? ''}
                isFixed
                canEdit={canEdit}
                ministerName={ministerName}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.fieldId]: v }))}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Custom fields ────────────────────────────────────────────────── */}
      {!fieldsError && customFields.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Campos do ministério</h2>
          <div className={styles.fieldList}>
            {customFields.map((f) => (
              <FieldItem
                key={f.fieldId}
                field={f}
                value={values[f.fieldId] ?? ''}
                isFixed={false}
                canEdit={canEdit}
                ministerName={ministerName}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.fieldId]: v }))}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Minister actions ─────────────────────────────────────────────── */}
      {!fieldsError && fields.length > 0 && canEdit && (
        <div className={styles.actions}>
          {saved && (
            <div className={styles.successBanner}>
              <CheckCircle2 size={15} strokeWidth={1.75} />
              Campos salvos com sucesso!
            </div>
          )}
          {saveError && <p className={styles.saveError}>{saveError}</p>}
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? 'Salvando...' : 'Salvar campos'}
          </button>
        </div>
      )}

    </div>
  );
}

// ─── FieldItem ────────────────────────────────────────────────────────────────

interface FieldItemProps {
  field: FieldEntry;
  value: string;
  isFixed: boolean;
  canEdit: boolean;
  ministerName: string | null;
  onChange: (v: string) => void;
}

function FieldItem({ field, value, isFixed, canEdit, ministerName, onChange }: FieldItemProps) {
  const isFilled = Boolean(value);

  return (
    <div className={styles.fieldItem}>
      <div className={styles.fieldHeader}>
        {!canEdit && (
          <span
            className={isFilled ? styles.statusDotFilled : styles.statusDotPending}
            aria-hidden="true"
          />
        )}
        <label className={styles.fieldLabel} htmlFor={`field-${field.fieldId}`}>
          {field.label}
        </label>
        {isFixed && <span className={styles.fixedBadge}>template</span>}
      </div>

      {canEdit ? (
        <textarea
          id={`field-${field.fieldId}`}
          className={styles.textarea}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder={`Preencher ${field.label.toLowerCase()}...`}
        />
      ) : isFilled ? (
        <div className={styles.readOnlyValue}>
          <p className={styles.readOnlyText}>{value}</p>
          <div className={styles.filledMeta}>
            {field.filledBy && <span>Preenchido por {field.filledBy.name}</span>}
            {field.filledAt && <span className={styles.filledDate}>{fmtShort(field.filledAt)}</span>}
          </div>
        </div>
      ) : (
        <div className={styles.pendingValue}>
          <Clock size={13} strokeWidth={1.75} className={styles.pendingIcon} />
          <span className={styles.pendingText}>
            {ministerName
              ? `Aguardando preenchimento de ${ministerName}`
              : 'Aguardando designação do Ministro Responsável'}
          </span>
        </div>
      )}
    </div>
  );
}
