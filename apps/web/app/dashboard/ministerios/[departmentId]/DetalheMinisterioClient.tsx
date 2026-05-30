'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, ClipboardList, Pencil, UserCog, Users, X } from 'lucide-react';
import type { TokenPayload } from '@/lib/auth';
import { useChurch } from '@/lib/church-context';
import styles from './DetalheMinisterioClient.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeptField   { id: string; label: string; order: number }
interface DeptMember  {
  joinedAt: string;
  user: { id: string; name: string; avatarUrl: string | null; churchRoles: { role: string }[] };
}
interface DeptSchedule {
  id: string;
  scheduleInfo: string | null;
  minister: { id: string; name: string } | null;
  event: { id: string; title: string; startsAt: string };
}
interface DepartmentDetail {
  id: string;
  name: string;
  description: string | null;
  template: string;
  isActive: boolean;
  leader: { id: string; name: string; avatarUrl: string | null } | null;
  fields: DeptField[];
  members: DeptMember[];
}

interface Props {
  departmentId: string;
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

const ROLE_LABEL: Record<string, string> = {
  pastor_central:  'Pastor Central',
  pastor_auxiliar: 'Pastor Auxiliar',
  lider:           'Líder',
  membro:          'Membro',
};

const LEADER_ROLES = ['pastor_central', 'pastor_auxiliar', 'lider'];

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DetalheMinisterioClient({ departmentId, session }: Props) {
  const router = useRouter();
  const { activeChurch } = useChurch();
  const churchId = activeChurch?.churchId;

  const [dept, setDept]           = useState<DepartmentDetail | null>(null);
  const [schedules, setSchedules] = useState<DeptSchedule[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  // Eligible leaders for the change-leader modal
  const [eligibleLeaders, setEligibleLeaders] = useState<{ id: string; name: string }[]>([]);

  // Change-leader modal
  const [showLeaderModal, setShowLeaderModal] = useState(false);
  const [newLeaderId, setNewLeaderId]         = useState('');
  const [leaderSaving, setLeaderSaving]       = useState(false);
  const [leaderError, setLeaderError]         = useState<string | null>(null);

  const isAdmin =
    session?.isSuporte ||
    session?.role === 'pastor_central' ||
    session?.role === 'pastor_auxiliar';

  const canEdit =
    isAdmin || (session?.role === 'lider' && dept?.leader?.id === session?.sub);

  const canChangeLeader =
    session?.isSuporte ||
    session?.role === 'pastor_central' ||
    session?.role === 'pastor_auxiliar';

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [deptRes, schedRes, membersRes] = await Promise.all([
        fetch(`/api/churches/${churchId}/departments/${departmentId}`),
        fetch(`/api/churches/${churchId}/departments/${departmentId}/schedules`),
        fetch(`/api/churches/${churchId}/members`),
      ]);

      if (!deptRes.ok) {
        setLoadError('Ministério não encontrado.');
        return;
      }
      setDept(await deptRes.json());
      if (schedRes.ok) setSchedules(await schedRes.json());

      if (membersRes.ok) {
        const all: { id: string; name: string; role: string }[] = await membersRes.json();
        setEligibleLeaders(all.filter((m) => LEADER_ROLES.includes(m.role)));
      }
    } catch {
      setLoadError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [churchId, departmentId]);

  useEffect(() => { void load(); }, [load]);

  // ── Change leader ──────────────────────────────────────────────────────────

  function openLeaderModal() {
    setNewLeaderId(dept?.leader?.id ?? '');
    setLeaderError(null);
    setShowLeaderModal(true);
  }

  async function handleChangeLeader() {
    if (!churchId || !dept || !newLeaderId) return;
    setLeaderSaving(true);
    setLeaderError(null);
    try {
      const res = await fetch(`/api/churches/${churchId}/departments/${dept.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaderId: newLeaderId }),
      });
      if (res.ok) {
        setShowLeaderModal(false);
        void load();
      } else {
        const data = await res.json().catch(() => ({}));
        setLeaderError((data as { message?: string }).message ?? 'Erro ao trocar líder.');
      }
    } catch {
      setLeaderError('Erro de conexão.');
    } finally {
      setLeaderSaving(false);
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

  if (loadError || !dept) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorText}>{loadError ?? 'Ministério não encontrado.'}</p>
      </div>
    );
  }

  const templateColor  = TEMPLATE_COLOR[dept.template] ?? 'var(--color-text-secondary)';
  const templateLabel  = TEMPLATE_LABEL[dept.template] ?? dept.template;
  const fixedLabels    = FIXED_FIELDS[dept.template] ?? [];
  const fixedSet       = new Set(fixedLabels);
  const customFields   = dept.fields.filter((f) => !fixedSet.has(f.label)).sort((a, b) => a.order - b.order);
  const isCronograma   = dept.template === 'cronograma_culto';

  return (
    <div className={styles.root}>

      {/* ── Nav bar ───────────────────────────────────────────────────────── */}
      <div className={styles.navBar}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard/ministerios')}>
          <ArrowLeft size={16} strokeWidth={1.75} />
          Ministérios
        </button>
        <div className={styles.navActions}>
          {canChangeLeader && !isCronograma && (
            <button className={styles.actionSecondary} onClick={openLeaderModal}>
              <UserCog size={15} strokeWidth={1.75} />
              Trocar líder
            </button>
          )}
          {canEdit && (
            <Link
              href={`/dashboard/ministerios/${dept.id}/editar`}
              className={styles.actionPrimary}
            >
              <Pencil size={15} strokeWidth={1.75} />
              Editar
            </Link>
          )}
        </div>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className={styles.hero} style={{ borderLeftColor: templateColor }}>
        <div className={styles.heroMain}>
          <div className={styles.heroTitle}>
            <h1 className={styles.deptName}>{dept.name}</h1>
            {!dept.isActive && <span className={styles.inactiveBadge}>Inativo</span>}
          </div>
          <span className={styles.templateBadge} style={{ color: templateColor }}>
            {templateLabel}
          </span>
          {dept.description && (
            <p className={styles.description}>{dept.description}</p>
          )}
        </div>

        {dept.leader && (
          <div className={styles.leaderChip}>
            <div className={styles.avatar}>{initials(dept.leader.name)}</div>
            <div>
              <span className={styles.leaderRole}>Líder</span>
              <span className={styles.leaderName}>{dept.leader.name}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Campos ────────────────────────────────────────────────────────── */}
      {(fixedLabels.length > 0 || customFields.length > 0) && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Campos</h2>
          <div className={styles.fieldGrid}>
            {fixedLabels.map((label) => (
              <div key={label} className={styles.fieldChip}>
                <span className={styles.fieldLabel}>{label}</span>
                <span className={styles.fieldTag}>automático</span>
              </div>
            ))}
            {customFields.map((f) => (
              <div key={f.id} className={styles.fieldChip}>
                <span className={styles.fieldLabel}>{f.label}</span>
              </div>
            ))}
          </div>
          {fixedLabels.length === 0 && customFields.length === 0 && (
            <p className={styles.emptyHint}>Nenhum campo configurado.</p>
          )}
        </section>
      )}

      {/* ── Membros ───────────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Users size={15} strokeWidth={1.75} />
          Membros{dept.members.length > 0 ? ` (${dept.members.length})` : ''}
        </h2>

        {dept.members.length === 0 ? (
          <p className={styles.emptyHint}>Nenhum membro neste ministério.</p>
        ) : (
          <div className={styles.memberList}>
            {dept.members.map((m) => {
              const role = m.user.churchRoles[0]?.role ?? 'membro';
              return (
                <div key={m.user.id} className={styles.memberRow}>
                  <div className={styles.avatar}>{initials(m.user.name)}</div>
                  <div className={styles.memberInfo}>
                    <span className={styles.memberName}>{m.user.name}</span>
                    <span className={styles.memberJoined}>Desde {fmtDate(m.joinedAt)}</span>
                  </div>
                  <span className={styles.roleBadge}>{ROLE_LABEL[role] ?? role}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Escalas recentes ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Calendar size={15} strokeWidth={1.75} />
          Escalas recentes
        </h2>

        {schedules.length === 0 ? (
          <p className={styles.emptyHint}>Nenhuma escala registrada para este ministério.</p>
        ) : (
          <div className={styles.scheduleList}>
            {schedules.map((s) => {
              const isMySchedule = session?.sub === s.minister?.id;
              const showFields   = isAdmin || isMySchedule || session?.role === 'lider';
              return (
                <div key={s.id} className={styles.scheduleRow}>
                  <div className={styles.scheduleDate}>
                    {fmtDateShort(s.event.startsAt)}
                  </div>
                  <div className={styles.scheduleInfo}>
                    <span className={styles.scheduleTitle}>{s.event.title}</span>
                    {s.scheduleInfo && (
                      <span className={styles.scheduleExtra}>{s.scheduleInfo}</span>
                    )}
                  </div>
                  <div className={styles.scheduleMinister}>
                    {s.minister ? (
                      <>
                        <div className={styles.avatarSm}>{initials(s.minister.name)}</div>
                        <span>{s.minister.name}</span>
                      </>
                    ) : (
                      <span className={styles.emptyHint}>Sem ministro</span>
                    )}
                  </div>
                  {showFields && (
                    <Link
                      href={`/dashboard/escalas/${s.id}/campos`}
                      className={styles.scheduleFieldsLink}
                      title="Campos da escala"
                    >
                      <ClipboardList size={14} strokeWidth={1.75} />
                      {isMySchedule ? 'Preencher' : 'Campos'}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Modal: trocar líder ───────────────────────────────────────────── */}
      {showLeaderModal && (
        <div className={styles.overlay} onClick={() => !leaderSaving && setShowLeaderModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Trocar Líder Responsável</h3>
              <button
                className={styles.modalClose}
                onClick={() => setShowLeaderModal(false)}
                disabled={leaderSaving}
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <p className={styles.modalHint}>
              Líder atual:{' '}
              <strong>{dept.leader?.name ?? 'Sem líder'}</strong>
            </p>

            <select
              className={styles.select}
              value={newLeaderId}
              onChange={(e) => setNewLeaderId(e.target.value)}
              disabled={leaderSaving}
            >
              <option value="">Selecione um novo líder...</option>
              {eligibleLeaders.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            {leaderError && <p className={styles.modalError}>{leaderError}</p>}

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setShowLeaderModal(false)}
                disabled={leaderSaving}
              >
                Cancelar
              </button>
              <button
                className={styles.modalConfirm}
                onClick={handleChangeLeader}
                disabled={leaderSaving || !newLeaderId || newLeaderId === dept.leader?.id}
              >
                {leaderSaving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
