'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { useChurch } from '@/lib/church-context';
import styles from './NovoMinisterioClient.module.css';

// ─── Template metadata ────────────────────────────────────────────────────────

interface TemplateCfg {
  id: string;
  label: string;
  description: string;
  fixedFields: string[];
  color: string;
  bg: string;
}

const TEMPLATES: TemplateCfg[] = [
  {
    id: 'louvor',
    label: 'Louvor',
    description: 'Equipe de música, adoração e instrumentistas.',
    fixedFields: [],
    color: 'var(--ministry-louvor)',
    bg: 'var(--ministry-louvor-bg)',
  },
  {
    id: 'gc',
    label: 'Grupos de Célula',
    description: 'Gestão de grupos de célula e líderes.',
    fixedFields: [],
    color: 'var(--ministry-gc)',
    bg: 'var(--ministry-gc-bg)',
  },
  {
    id: 'midia',
    label: 'Mídia',
    description: 'Transmissão ao vivo, fotografia e redes sociais.',
    fixedFields: [],
    color: 'var(--ministry-midia)',
    bg: 'var(--ministry-midia-bg)',
  },
  {
    id: 'discipulado',
    label: 'Discipulado',
    description: 'Formação espiritual e crescimento de líderes.',
    fixedFields: [],
    color: 'var(--ministry-disc)',
    bg: 'var(--ministry-disc-bg)',
  },
  {
    id: 'adolescentes',
    label: 'Adolescentes',
    description: 'Ministério voltado a jovens e adolescentes.',
    fixedFields: [],
    color: 'var(--ministry-adol)',
    bg: 'var(--ministry-adol-bg)',
  },
  {
    id: 'danca',
    label: 'Dança',
    description: 'Expressão artística através da dança litúrgica.',
    fixedFields: ['Figurino'],
    color: 'var(--ministry-danca)',
    bg: 'var(--ministry-danca-bg)',
  },
  {
    id: 'cronograma_culto',
    label: 'Cronograma do Culto',
    description: 'Planejamento e sequência do culto. Não requer líder responsável.',
    fixedFields: [],
    color: 'var(--ministry-cron)',
    bg: 'var(--ministry-cron-bg)',
  },
  {
    id: 'personalizado',
    label: 'Personalizado',
    description: 'Ministério sem template fixo — campos completamente personalizados.',
    fixedFields: [],
    color: 'var(--color-text-secondary)',
    bg: 'var(--color-bg-02)',
  },
];

const LEADER_ROLES = ['pastor_central', 'pastor_auxiliar', 'lider'];

interface Member {
  id: string;
  name: string;
  role: string;
}

interface CustomField {
  uid: string;
  label: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NovoMinisterioClient() {
  const router = useRouter();
  const { activeChurch } = useChurch();
  const churchId = activeChurch?.churchId;

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Step 2
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [leaderId, setLeaderId]       = useState('');
  const [members, setMembers]         = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Step 3
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const dragIndex = useRef<number | null>(null);

  const templateCfg     = TEMPLATES.find((t) => t.id === selectedTemplate) ?? null;
  const isCronograma    = selectedTemplate === 'cronograma_culto';
  const step2Valid      = name.trim().length >= 2 && (isCronograma || !!leaderId);

  // Load eligible leaders when entering step 2
  const loadMembers = useCallback(async () => {
    if (!churchId) return;
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/churches/${churchId}/members`);
      if (res.ok) {
        const data: Member[] = await res.json();
        setMembers(data.filter((m) => LEADER_ROLES.includes(m.role)));
      }
    } catch {
      // non-critical — select stays empty
    } finally {
      setMembersLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    if (step === 2) void loadMembers();
  }, [step, loadMembers]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goNext() { setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s)); }
  function goPrev() { setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s)); }

  // ── Custom fields ───────────────────────────────────────────────────────────

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

  async function handleSubmit() {
    if (!churchId || !selectedTemplate) return;
    setSubmitting(true);
    setError(null);

    const fields = customFields
      .filter((f) => f.label.trim().length > 0)
      .map((f, i) => ({ label: f.label.trim(), order: i }));

    const body: Record<string, unknown> = {
      name: name.trim(),
      template: selectedTemplate,
      fields,
    };
    if (description.trim()) body.description = description.trim();
    if (!isCronograma && leaderId) body.leaderId = leaderId;

    try {
      const res = await fetch(`/api/churches/${churchId}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        router.push('/dashboard/ministerios');
        return;
      }

      const data = await res.json().catch(() => ({}));
      setError((data as { message?: string }).message ?? 'Erro ao criar ministério.');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={styles.root}>
      {/* Stepper */}
      <div className={styles.stepper}>
        {(['Template', 'Configuração', 'Campos'] as const).map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          return (
            <div
              key={label}
              className={[styles.stepItem, step >= n ? styles.stepActive : ''].filter(Boolean).join(' ')}
            >
              <div className={styles.stepDot}>
                {step > n ? <Check size={12} strokeWidth={2.5} /> : n}
              </div>
              <span className={styles.stepLabel}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Template ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Escolha o template</h2>
          <div className={styles.templateGrid}>
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className={[
                  styles.templateCard,
                  selectedTemplate === tpl.id ? styles.templateCardSelected : '',
                ].filter(Boolean).join(' ')}
                style={
                  selectedTemplate === tpl.id
                    ? ({ '--card-accent': tpl.color } as React.CSSProperties)
                    : undefined
                }
                onClick={() => setSelectedTemplate(tpl.id)}
              >
                <div className={styles.templateAccent} style={{ background: tpl.color }} />
                <div className={styles.templateCardInner}>
                  <span className={styles.templateName} style={{ color: tpl.color }}>
                    {tpl.label}
                  </span>
                  <span className={styles.templateDesc}>{tpl.description}</span>
                  {tpl.fixedFields.length > 0 && (
                    <div className={styles.fixedPreview}>
                      {tpl.fixedFields.map((f) => (
                        <span key={f} className={styles.fixedChip}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className={styles.nav}>
            <button
              className={styles.btnSecondary}
              onClick={() => router.push('/dashboard/ministerios')}
            >
              <ArrowLeft size={15} strokeWidth={1.75} />
              Cancelar
            </button>
            <button className={styles.btnPrimary} disabled={!selectedTemplate} onClick={goNext}>
              Próximo
              <ArrowRight size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Config ───────────────────────────────────────────────────── */}
      {step === 2 && templateCfg && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Configure o ministério</h2>

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>
                Nome <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                type="text"
                placeholder="Ex: Louvor Central"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Descrição{' '}
                <span className={styles.optional}>(opcional)</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Descreva brevemente o ministério..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={300}
              />
            </div>

            {!isCronograma && (
              <div className={styles.field}>
                <label className={styles.label}>
                  Líder Responsável <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.select}
                  value={leaderId}
                  onChange={(e) => setLeaderId(e.target.value)}
                  disabled={membersLoading}
                >
                  <option value="">
                    {membersLoading ? 'Carregando...' : 'Selecione um líder...'}
                  </option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {!membersLoading && members.length === 0 && (
                  <span className={styles.fieldHint}>
                    Nenhum membro com papel de líder ou superior encontrado.
                  </span>
                )}
              </div>
            )}

            {templateCfg.fixedFields.length > 0 && (
              <div className={styles.fixedSection}>
                <span className={styles.fixedSectionTitle}>
                  Campos incluídos automaticamente
                </span>
                <div className={styles.fixedList}>
                  {templateCfg.fixedFields.map((f) => (
                    <div key={f} className={styles.fixedItem}>
                      <span className={styles.fixedItemLabel}>{f}</span>
                      <span className={styles.fixedItemTag}>automático</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={styles.nav}>
            <button className={styles.btnSecondary} onClick={goPrev}>
              <ArrowLeft size={15} strokeWidth={1.75} />
              Voltar
            </button>
            <button className={styles.btnPrimary} disabled={!step2Valid} onClick={goNext}>
              Próximo
              <ArrowRight size={15} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Custom fields ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Campos customizáveis</h2>
          <p className={styles.stepHint}>
            Adicione campos extras que o Ministro Responsável preencherá a cada escala.
            Arraste para reordenar.
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
              <p className={styles.emptyFields}>
                Nenhum campo adicionado. O ministério pode funcionar sem campos customizáveis.
              </p>
            )}
          </div>

          <button className={styles.addFieldBtn} onClick={addField}>
            <Plus size={14} strokeWidth={2} />
            Adicionar campo
          </button>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.nav}>
            <button className={styles.btnSecondary} onClick={goPrev} disabled={submitting}>
              <ArrowLeft size={15} strokeWidth={1.75} />
              Voltar
            </button>
            <button
              className={styles.btnPrimary}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Criando...' : (
                <>
                  Criar Ministério
                  <Check size={15} strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
