'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { TokenPayload } from '@/lib/auth';
import { useChurch } from '@/lib/church-context';
import styles from './EditarMinisterioClient.module.css';

// ─── Template metadata (mirrors back-end seeder) ──────────────────────────────

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

// Fixed fields seeded automatically — must not appear in the editable list
const FIXED_FIELDS: Partial<Record<string, string[]>> = {
  danca: ['Figurino'],
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface DepartmentDetail {
  id: string;
  name: string;
  description: string | null;
  template: string;
  isActive: boolean;
  leader: { id: string; name: string } | null;
  fields: { id: string; label: string; order: number }[];
}

interface Member {
  id: string;
  name: string;
  role: string;
}

interface CustomField {
  uid: string;
  label: string;
}

interface Props {
  departmentId: string;
  session: TokenPayload | null;
}

const LEADER_ROLES = ['pastor_central', 'pastor_auxiliar', 'lider'];

// ─── Component ────────────────────────────────────────────────────────────────

export function EditarMinisterioClient({ departmentId, session }: Props) {
  const router = useRouter();
  const { activeChurch } = useChurch();
  const churchId = activeChurch?.churchId;

  // Remote data
  const [dept, setDept]           = useState<DepartmentDetail | null>(null);
  const [members, setMembers]     = useState<Member[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Form state (mirrors dept after load)
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [leaderId, setLeaderId]       = useState('');
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Action state
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);
  const [saved, setSaved]           = useState(false);

  const dragIndex = useRef<number | null>(null);

  const isCronograma = dept?.template === 'cronograma_culto';
  const fixedLabels  = dept ? (FIXED_FIELDS[dept.template] ?? []) : [];

  // ── Load department + eligible leaders ─────────────────────────────────────

  const loadData = useCallback(async () => {
    if (!churchId) return;
    setPageLoading(true);
    setLoadError(null);

    try {
      const [deptRes, membersRes] = await Promise.all([
        fetch(`/api/churches/${churchId}/departments/${departmentId}`),
        fetch(`/api/churches/${churchId}/members`),
      ]);

      if (!deptRes.ok) {
        const d = await deptRes.json().catch(() => ({}));
        setLoadError((d as { message?: string }).message ?? 'Ministério não encontrado.');
        return;
      }

      const deptData: DepartmentDetail = await deptRes.json();
      setDept(deptData);

      // Pre-fill form
      setName(deptData.name);
      setDescription(deptData.description ?? '');
      setLeaderId(deptData.leader?.id ?? '');

      // Separate fixed from custom fields
      const fixedSet = new Set(FIXED_FIELDS[deptData.template] ?? []);
      const custom = deptData.fields
        .filter((f) => !fixedSet.has(f.label))
        .sort((a, b) => a.order - b.order)
        .map((f) => ({ uid: f.id, label: f.label }));
      setCustomFields(custom);

      // Load eligible leaders
      if (membersRes.ok) {
        const membersData: Member[] = await membersRes.json();
        setMembers(membersData.filter((m) => LEADER_ROLES.includes(m.role)));
      }
    } catch {
      setLoadError('Erro de conexão.');
    } finally {
      setPageLoading(false);
    }
  }, [churchId, departmentId]);

  useEffect(() => { void loadData(); }, [loadData]);

  // ── Permission guard ────────────────────────────────────────────────────────
  // If lider, only allow if they are the department leader
  const isAdmin =
    session?.isSuporte ||
    session?.role === 'pastor_central' ||
    session?.role === 'pastor_auxiliar';

  const isOwnLeader = session?.role === 'lider' && dept?.leader?.id === session?.sub;
  const hasPermission = isAdmin || isOwnLeader;

  // ── Custom fields helpers ───────────────────────────────────────────────────

  function addField() {
    setCustomFields((prev) => [...prev, { uid: crypto.randomUUID(), label: '' }]);
  }

  function updateField(uid: string, value: string) {
    setCustomFields((prev) => prev.map((f) => (f.uid === uid ? { ...f, label: value } : f)));
  }

  function removeField(uid: string) {
    setCustomFields((prev) => prev.filter((f) => f.uid !== uid));
  }

  function moveField(index: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= customFields.length) return;
    const next = [...customFields];
    [next[index], next[target]] = [next[target], next[index]];
    setCustomFields(next);
  }

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    const next = [...customFields];
    const [item] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, item);
    dragIndex.current = index;
    setCustomFields(next);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!churchId || !dept) return;
    setSaveError(null);
    setSubmitting(true);
    setSaved(false);

    const fields = customFields
      .filter((f) => f.label.trim().length > 0)
      .map((f, i) => ({ label: f.label.trim(), order: i }));

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      fields,
    };

    if (!isCronograma) {
      body.leaderId = leaderId || null;
    }

    try {
      const res = await fetch(`/api/churches/${churchId}/departments/${dept.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => router.push('/dashboard/ministerios'), 800);
        return;
      }

      const data = await res.json().catch(() => ({}));
      setSaveError((data as { message?: string }).message ?? 'Erro ao salvar.');
    } catch {
      setSaveError('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render states ───────────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className={styles.centered}>
        <span className={styles.spinner} aria-label="Carregando..." />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>{loadError}</p>
      </div>
    );
  }

  if (!dept || !hasPermission) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>
          {!dept ? 'Ministério não encontrado.' : 'Sem permissão para editar este ministério.'}
        </p>
      </div>
    );
  }

  const templateColor = TEMPLATE_COLOR[dept.template] ?? 'var(--color-text-secondary)';
  const templateLabel = TEMPLATE_LABEL[dept.template] ?? dept.template;
  const canSave = name.trim().length >= 2 && (isCronograma || !!leaderId);

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => router.push('/dashboard/ministerios')}
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Ministérios
        </button>
        <div className={styles.headerRight}>
          <span
            className={styles.templateBadge}
            style={{ color: templateColor, borderColor: templateColor }}
          >
            {templateLabel}
          </span>
          {!dept.isActive && (
            <span className={styles.inactiveBadge}>Inativo</span>
          )}
        </div>
      </div>

      <h1 className={styles.pageTitle}>Editar ministério</h1>

      {/* ── Basic info ─────────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Informações gerais</h2>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>
              Nome <span className={styles.required}>*</span>
            </label>
            <input
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>
              Descrição{' '}
              <span className={styles.optional}>(opcional)</span>
            </label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={300}
            />
          </div>

          {!isCronograma && (
            <div className={styles.field}>
              <label className={styles.label}>
                Líder Responsável{' '}
                {isAdmin && <span className={styles.optional}>(pode ficar vazio)</span>}
                {!isAdmin && <span className={styles.required}>*</span>}
              </label>
              <select
                className={styles.select}
                value={leaderId}
                onChange={(e) => setLeaderId(e.target.value)}
              >
                <option value="">Selecione um líder...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </section>

      {/* ── Fixed fields ───────────────────────────────────────────────────── */}
      {fixedLabels.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Campos incluídos automaticamente</h2>
          <p className={styles.sectionHint}>
            Esses campos fazem parte do template e não podem ser removidos.
          </p>
          <div className={styles.fixedList}>
            {fixedLabels.map((label) => (
              <div key={label} className={styles.fixedItem}>
                <span className={styles.fixedItemLabel}>{label}</span>
                <span className={styles.fixedItemTag}>automático</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Custom fields ──────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Campos customizáveis</h2>
        <p className={styles.sectionHint}>
          Arrastar para reordenar. Ao salvar, a lista substituirá os campos atuais.
        </p>

        <div className={styles.fieldList}>
          {customFields.map((f, i) => (
            <div
              key={f.uid}
              className={styles.fieldRow}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={() => { dragIndex.current = null; }}
            >
              <GripVertical size={16} strokeWidth={1.5} className={styles.dragHandle} />
              <input
                className={styles.fieldInput}
                type="text"
                placeholder="Nome do campo"
                value={f.label}
                onChange={(e) => updateField(f.uid, e.target.value)}
                maxLength={60}
              />
              <div className={styles.moveButtons}>
                <button
                  className={styles.moveBtn}
                  onClick={() => moveField(i, 'up')}
                  disabled={i === 0}
                  title="Mover para cima"
                >
                  <ChevronUp size={13} strokeWidth={2} />
                </button>
                <button
                  className={styles.moveBtn}
                  onClick={() => moveField(i, 'down')}
                  disabled={i === customFields.length - 1}
                  title="Mover para baixo"
                >
                  <ChevronDown size={13} strokeWidth={2} />
                </button>
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => removeField(f.uid)}
                title="Remover campo"
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </button>
            </div>
          ))}

          {customFields.length === 0 && (
            <p className={styles.emptyFields}>Nenhum campo customizável.</p>
          )}
        </div>

        <button className={styles.addFieldBtn} onClick={addField}>
          <Plus size={14} strokeWidth={2} />
          Adicionar campo
        </button>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      {saveError && <p className={styles.errorText}>{saveError}</p>}

      <div className={styles.footer}>
        <button
          className={styles.btnSecondary}
          onClick={() => router.push('/dashboard/ministerios')}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button
          className={[styles.btnPrimary, saved ? styles.btnSaved : ''].filter(Boolean).join(' ')}
          onClick={handleSave}
          disabled={submitting || !canSave || saved}
        >
          {saved ? (
            'Salvo!'
          ) : (
            <>
              <Save size={15} strokeWidth={1.75} />
              {submitting ? 'Salvando...' : 'Salvar alterações'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
