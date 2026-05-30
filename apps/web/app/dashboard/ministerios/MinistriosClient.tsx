'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Pencil, Plus, PowerOff, Trash2, Users, X } from 'lucide-react';
import type { TokenPayload } from '@/lib/auth';
import { useChurch } from '@/lib/church-context';
import styles from './MinistriosClient.module.css';

interface Department {
  id: string;
  name: string;
  template: string;
  isActive: boolean;
  leader: { id: string; name: string } | null;
  memberCount: number;
}

interface Props {
  session: TokenPayload | null;
}

const TEMPLATE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  louvor:           { label: 'Louvor',             color: 'var(--ministry-louvor)',      bg: 'var(--ministry-louvor-bg)'  },
  gc:               { label: 'Grupos de Célula',    color: 'var(--ministry-gc)',          bg: 'var(--ministry-gc-bg)'      },
  midia:            { label: 'Mídia',               color: 'var(--ministry-midia)',       bg: 'var(--ministry-midia-bg)'   },
  discipulado:      { label: 'Discipulado',         color: 'var(--ministry-disc)',        bg: 'var(--ministry-disc-bg)'    },
  adolescentes:     { label: 'Adolescentes',        color: 'var(--ministry-adol)',        bg: 'var(--ministry-adol-bg)'    },
  danca:            { label: 'Dança',               color: 'var(--ministry-danca)',       bg: 'var(--ministry-danca-bg)'   },
  cronograma_culto: { label: 'Cronograma do Culto', color: 'var(--ministry-cron)',        bg: 'var(--ministry-cron-bg)'    },
  personalizado:    { label: 'Personalizado',       color: 'var(--color-text-secondary)', bg: 'var(--color-bg-02)'        },
};

function canManage(session: TokenPayload | null): boolean {
  if (!session) return false;
  return session.isSuporte || session.role === 'pastor_central' || session.role === 'pastor_auxiliar';
}

function canEditDept(session: TokenPayload | null, dept: Department): boolean {
  if (!session) return false;
  if (canManage(session)) return true;
  return session.role === 'lider' && dept.leader?.id === session.sub;
}

function parseConflictReasons(msg: string): string[] {
  const reasons: string[] = [];
  const memberMatch = msg.match(/(\d+)\s+membro/);
  const scheduleMatch = msg.match(/(\d+)\s+escala/);
  if (memberMatch) {
    const n = parseInt(memberMatch[1], 10);
    reasons.push(`${n} membro${n === 1 ? '' : 's'} ativo${n === 1 ? '' : 's'} vinculado${n === 1 ? '' : 's'} ao ministério`);
  }
  if (scheduleMatch) {
    const n = parseInt(scheduleMatch[1], 10);
    reasons.push(`${n} escala${n === 1 ? '' : 's'} futura${n === 1 ? '' : 's'} já agendada${n === 1 ? '' : 's'}`);
  }
  return reasons.length > 0 ? reasons : [msg];
}

export function MinistriosClient({ session }: Props) {
  const { activeChurch, isLoading: churchLoading } = useChurch();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [toastMsg, setToastMsg]       = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Deactivate flow
  const [confirmDeactivate, setConfirmDeactivate] = useState<{ id: string; name: string } | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError]     = useState<{ name: string; reasons: string[] } | null>(null);

  // Delete flow
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const churchId = activeChurch?.churchId;

  const loadDepartments = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/churches/${churchId}/departments`);
      if (!res.ok) { setError('Erro ao carregar ministérios.'); return; }
      setDepartments(await res.json());
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => { void loadDepartments(); }, [loadDepartments]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────

  async function handleDeactivate() {
    if (!churchId || !confirmDeactivate) return;
    const { id, name } = confirmDeactivate;
    setDeactivateLoading(true);
    setActionLoading(id);
    try {
      const res = await fetch(`/api/churches/${churchId}/departments/${id}/deactivate`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setConfirmDeactivate(null);
        showToast(`"${name}" inativado com sucesso.`);
        void loadDepartments();
        return;
      }

      const data = await res.json().catch(() => ({}));
      const msg: string = (data as { message?: string }).message ?? '';
      setConfirmDeactivate(null);

      if (res.status === 409) {
        setDeactivateError({ name, reasons: parseConflictReasons(msg) });
      } else {
        showToast(msg || 'Erro ao inativar ministério.');
      }
    } catch {
      setConfirmDeactivate(null);
      showToast('Erro de conexão.');
    } finally {
      setDeactivateLoading(false);
      setActionLoading(null);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!churchId || !confirmDelete) return;
    const { id, name } = confirmDelete;
    setDeleteLoading(true);
    setActionLoading(id);
    try {
      const res = await fetch(`/api/churches/${churchId}/departments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setConfirmDelete(null);
        showToast(`"${name}" deletado com sucesso.`);
        void loadDepartments();
      } else {
        const data = await res.json().catch(() => ({}));
        setConfirmDelete(null);
        showToast((data as { message?: string }).message ?? 'Erro ao deletar ministério.');
      }
    } catch {
      setConfirmDelete(null);
      showToast('Erro de conexão.');
    } finally {
      setDeleteLoading(false);
      setActionLoading(null);
    }
  }

  const isAdmin = canManage(session);

  // ── Loading / empty states ─────────────────────────────────────────────────

  if (churchLoading) {
    return (
      <div className={styles.centered}>
        <span className={styles.spinner} aria-label="Carregando..." />
      </div>
    );
  }

  if (!activeChurch) {
    return (
      <div className={styles.centered}>
        <p className={styles.emptyText}>Nenhuma igreja selecionada.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <h1 className={styles.heading}>Ministérios</h1>
        {isAdmin && (
          <Link href="/dashboard/ministerios/novo" className={styles.newBtn}>
            <Plus size={15} strokeWidth={2} />
            Novo Ministério
          </Link>
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}

      {loading && (
        <div className={styles.centered}>
          <span className={styles.spinner} aria-label="Carregando..." />
        </div>
      )}

      {!loading && !error && departments.length === 0 && (
        <p className={styles.emptyText}>Nenhum ministério cadastrado.</p>
      )}

      {!loading && !error && departments.length > 0 && (
        <div className={styles.list}>
          {departments.map((dept) => {
            const cfg = TEMPLATE_CONFIG[dept.template] ?? {
              label: dept.template,
              color: 'var(--color-text-secondary)',
              bg: 'var(--color-bg-02)',
            };
            const busy = actionLoading === dept.id;
            const showEdit       = canEditDept(session, dept);
            const showDeactivate = isAdmin && dept.isActive;
            const showDelete     = isAdmin && !dept.isActive;

            return (
              <div
                key={dept.id}
                className={[styles.card, !dept.isActive ? styles.cardInactive : ''].filter(Boolean).join(' ')}
              >
                <div className={styles.cardAccent} style={{ background: cfg.color }} />

                <div className={styles.cardBody}>
                  <div className={styles.cardMain}>
                    <div className={styles.cardTitle}>
                      <span className={styles.deptName}>{dept.name}</span>
                      {!dept.isActive && (
                        <span className={styles.inactiveBadge}>Inativo</span>
                      )}
                    </div>
                    <div className={styles.cardMeta}>
                      <span
                        className={styles.templateBadge}
                        style={{ color: cfg.color, background: cfg.bg }}
                      >
                        {cfg.label}
                      </span>
                      <span className={styles.metaItem}>
                        <Users size={12} strokeWidth={1.75} />
                        {dept.memberCount} {dept.memberCount === 1 ? 'membro' : 'membros'}
                      </span>
                      {dept.leader && (
                        <span className={styles.metaItem}>{dept.leader.name}</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    {showEdit && (
                      <Link
                        href={`/dashboard/ministerios/${dept.id}/editar`}
                        className={[styles.actionBtn, busy ? styles.actionBtnDisabled : ''].filter(Boolean).join(' ')}
                        title="Editar"
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                        <span>Editar</span>
                      </Link>
                    )}
                    {showDeactivate && (
                      <button
                        className={[styles.actionBtn, styles.actionWarn].join(' ')}
                        title="Inativar"
                        disabled={busy}
                        onClick={() => setConfirmDeactivate({ id: dept.id, name: dept.name })}
                      >
                        <PowerOff size={14} strokeWidth={1.75} />
                        <span>Inativar</span>
                      </button>
                    )}
                    {showDelete && (
                      <button
                        className={[styles.actionBtn, styles.actionDanger].join(' ')}
                        title="Deletar"
                        disabled={busy}
                        onClick={() => setConfirmDelete({ id: dept.id, name: dept.name })}
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                        <span>Deletar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: confirmar inativação ───────────────────────────────────── */}
      {confirmDeactivate && (
        <div className={styles.overlay} onClick={() => !deactivateLoading && setConfirmDeactivate(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={[styles.modalIcon, styles.modalIconWarn].join(' ')}>
                <PowerOff size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className={styles.modalTitle}>Inativar ministério</h3>
                <p className={styles.modalSubtitle}>{confirmDeactivate.name}</p>
              </div>
              <button
                className={styles.modalClose}
                onClick={() => setConfirmDeactivate(null)}
                disabled={deactivateLoading}
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <p className={styles.modalBody}>
              O ministério ficará <strong>invisível para membros</strong> e não aparecerá em
              novas escalas. Essa ação pode ser revertida reativando o ministério.
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setConfirmDeactivate(null)}
                disabled={deactivateLoading}
              >
                Cancelar
              </button>
              <button
                className={[styles.modalConfirmWarn, deactivateLoading ? styles.modalBtnLoading : ''].filter(Boolean).join(' ')}
                onClick={handleDeactivate}
                disabled={deactivateLoading}
              >
                {deactivateLoading ? 'Inativando...' : 'Inativar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: erro de inativação (409) ───────────────────────────────── */}
      {deactivateError && (
        <div className={styles.overlay} onClick={() => setDeactivateError(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={[styles.modalIcon, styles.modalIconDanger].join(' ')}>
                <AlertTriangle size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className={styles.modalTitle}>Não é possível inativar</h3>
                <p className={styles.modalSubtitle}>{deactivateError.name}</p>
              </div>
              <button className={styles.modalClose} onClick={() => setDeactivateError(null)}>
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <p className={styles.modalBody}>
              Remova os seguintes vínculos antes de inativar este ministério:
            </p>

            <ul className={styles.modalReasonList}>
              {deactivateError.reasons.map((r) => (
                <li key={r} className={styles.modalReason}>
                  {r}
                </li>
              ))}
            </ul>

            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setDeactivateError(null)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: confirmar exclusão ─────────────────────────────────────── */}
      {confirmDelete && (
        <div className={styles.overlay} onClick={() => !deleteLoading && setConfirmDelete(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={[styles.modalIcon, styles.modalIconDanger].join(' ')}>
                <Trash2 size={20} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className={styles.modalTitle}>Deletar ministério</h3>
                <p className={styles.modalSubtitle}>{confirmDelete.name}</p>
              </div>
              <button
                className={styles.modalClose}
                onClick={() => setConfirmDelete(null)}
                disabled={deleteLoading}
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>

            <p className={styles.modalBody}>
              Esta ação é <strong>permanente e irreversível</strong>. O ministério e todo o
              seu histórico serão excluídos.
            </p>

            <div className={styles.modalWarningBox}>
              <AlertTriangle size={14} strokeWidth={1.75} />
              <span>
                Isso inclui todos os campos customizáveis, configurações e dados de escalas
                associadas ao ministério.
              </span>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setConfirmDelete(null)}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              <button
                className={[styles.modalConfirmDanger, deleteLoading ? styles.modalBtnLoading : ''].filter(Boolean).join(' ')}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deletando...' : 'Deletar permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className={styles.toast} role="status">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
