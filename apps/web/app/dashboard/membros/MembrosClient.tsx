'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import type { TokenPayload } from '@/lib/auth';
import { useChurch } from '@/lib/church-context';
import { AddMemberForm } from '@/components/members/AddMemberForm';
import styles from './MembrosClient.module.css';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  departments: { id: string; name: string }[];
  joinedAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  department: { id: string; name: string } | null;
  invitedBy: { id: string; name: string };
  createdAt: string;
  expired: boolean;
  canResend: boolean;
}

const ROLE_LABEL: Record<string, string> = {
  pastor_central: 'Pastor Central',
  pastor_auxiliar: 'Pastor Auxiliar',
  lider: 'Líder',
  membro: 'Membro',
};

type Tab = 'ativos' | 'convites';

function canInvite(role: string) {
  return role === 'pastor_central' || role === 'pastor_auxiliar' || role === 'lider';
}

interface Props {
  session: TokenPayload | null;
}

export function MembrosClient({ session }: Props) {
  const { activeChurch, isLoading: churchLoading } = useChurch();
  const [tab, setTab] = useState<Tab>('ativos');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [resending, setResending] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const churchId = activeChurch?.churchId;

  const loadMembers = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/churches/${churchId}/members`);
      if (!res.ok) { setError('Erro ao carregar membros.'); return; }
      setMembers(await res.json());
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  const loadInvites = useCallback(async () => {
    if (!churchId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/churches/${churchId}/invites`);
      if (!res.ok) { setError('Erro ao carregar convites.'); return; }
      setInvites(await res.json());
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    if (tab === 'ativos') void loadMembers();
    else void loadInvites();
  }, [tab, loadMembers, loadInvites]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  async function handleResend(inviteId: string) {
    if (!churchId) return;
    setResending(inviteId);
    try {
      const res = await fetch(`/api/churches/${churchId}/invites/${inviteId}/resend`, { method: 'POST' });
      if (res.ok) {
        showToast('Convite reenviado com sucesso.');
        void loadInvites();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message ?? 'Erro ao reenviar convite.');
      }
    } catch {
      showToast('Erro de conexão.');
    } finally {
      setResending(null);
    }
  }

  function handleInviteSuccess() {
    setShowForm(false);
    showToast('Convite enviado com sucesso!');
    if (tab === 'convites') void loadInvites();
    else void loadMembers();
  }

  const userRole = session?.role ?? '';
  const showInviteBtn = canInvite(userRole);

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
        <div className={styles.tabs}>
          <button
            className={[styles.tab, tab === 'ativos' ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setTab('ativos')}
          >
            Ativos{members.length > 0 ? ` (${members.length})` : ''}
          </button>
          <button
            className={[styles.tab, tab === 'convites' ? styles.tabActive : ''].filter(Boolean).join(' ')}
            onClick={() => setTab('convites')}
          >
            Convites{invites.length > 0 ? ` (${invites.length})` : ''}
          </button>
        </div>

        {showInviteBtn && (
          <button className={styles.inviteBtn} onClick={() => setShowForm(true)}>
            <UserPlus size={15} strokeWidth={1.75} />
            Convidar
          </button>
        )}
      </div>

      {showForm && (
        <AddMemberForm
          churchId={churchId!}
          userRole={userRole}
          onSuccess={handleInviteSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {error && <p className={styles.errorText}>{error}</p>}

      {loading && (
        <div className={styles.centered}>
          <span className={styles.spinner} aria-label="Carregando..." />
        </div>
      )}

      {!loading && !error && tab === 'ativos' && (
        members.length === 0 ? (
          <p className={styles.emptyText}>Nenhum membro ativo encontrado.</p>
        ) : (
          <div className={styles.list}>
            {members.map((m) => (
              <div key={m.id} className={styles.card}>
                <div className={styles.cardAvatar}>
                  {m.name[0]?.toUpperCase()}
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{m.name}</span>
                  <span className={styles.cardEmail}>{m.email}</span>
                  {m.departments.length > 0 && (
                    <div className={styles.cardDepts}>
                      {m.departments.map((d) => (
                        <span key={d.id} className={styles.deptBadge}>{d.name}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.roleBadge}>{ROLE_LABEL[m.role] ?? m.role}</span>
                  <span className={styles.joinDate}>
                    {new Date(m.joinedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {!loading && !error && tab === 'convites' && (
        invites.length === 0 ? (
          <p className={styles.emptyText}>Nenhum convite pendente.</p>
        ) : (
          <div className={styles.list}>
            {invites.map((inv) => (
              <div key={inv.id} className={[styles.card, inv.expired ? styles.cardExpired : ''].filter(Boolean).join(' ')}>
                <div className={styles.cardAvatar}>
                  {inv.email[0]?.toUpperCase()}
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardName}>{inv.email}</span>
                  <span className={styles.cardEmail}>Convidado por {inv.invitedBy.name}</span>
                  {inv.department && (
                    <span className={styles.deptBadge}>{inv.department.name}</span>
                  )}
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.roleBadge}>{ROLE_LABEL[inv.role] ?? inv.role}</span>
                  {inv.expired ? (
                    <span className={styles.expiredBadge}>Expirado</span>
                  ) : null}
                  {inv.canResend && (
                    <button
                      className={styles.resendBtn}
                      onClick={() => handleResend(inv.id)}
                      disabled={resending === inv.id}
                    >
                      {resending === inv.id ? 'Reenviando...' : 'Reenviar'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {toastMsg && (
        <div className={styles.toast} role="status">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
