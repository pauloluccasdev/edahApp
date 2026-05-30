import type { TokenPayload } from './auth';

// ─── Template metadata ────────────────────────────────────────────────────────

/** Campos fixos semeados automaticamente pelo backend para cada template. */
export const TEMPLATE_FIXED_FIELDS: Readonly<Record<string, string[]>> = {
  louvor:           [],
  gc:               [],
  midia:            [],
  discipulado:      [],
  adolescentes:     [],
  danca:            ['Figurino'],
  cronograma_culto: [],
  personalizado:    [],
};

/** Retorna os campos fixos do template (vazio se não há nenhum). */
export function getFixedFields(template: string): string[] {
  return TEMPLATE_FIXED_FIELDS[template] ?? [];
}

/**
 * Cronograma do Culto é o único template que não exige líder responsável.
 * O backend aceita `leaderId: null` nesses casos.
 */
export function isLeaderRequired(template: string): boolean {
  return template !== 'cronograma_culto';
}

// ─── Custom field reordering ──────────────────────────────────────────────────

/** Move um item de `fromIndex` para `toIndex` via drag-and-drop. */
export function reorderFields<T>(fields: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return fields;
  const next = [...fields];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/** Move um item uma posição para cima ou para baixo (botões mobile). */
export function moveField<T>(fields: T[], index: number, direction: 'up' | 'down'): T[] {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= fields.length) return fields;
  const next = [...fields];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// ─── Permission helpers ───────────────────────────────────────────────────────

export interface DeptSummary {
  isActive: boolean;
  leader: { id: string } | null;
}

/** Pastores centrais, auxiliares e suporte podem gerenciar ministérios. */
export function canManage(session: TokenPayload | null): boolean {
  if (!session) return false;
  return (
    session.isSuporte ||
    session.role === 'pastor_central' ||
    session.role === 'pastor_auxiliar'
  );
}

/** Pode editar: admin OU líder responsável pelo ministério. */
export function canEditDept(session: TokenPayload | null, dept: DeptSummary): boolean {
  if (!session) return false;
  if (canManage(session)) return true;
  return session.role === 'lider' && dept.leader?.id === session.sub;
}

/** Pode inativar: admin + ministério ainda ativo. */
export function canDeactivateDept(session: TokenPayload | null, dept: DeptSummary): boolean {
  return canManage(session) && dept.isActive;
}

/** Pode deletar: admin + ministério já inativo. */
export function canDeleteDept(session: TokenPayload | null, dept: DeptSummary): boolean {
  return canManage(session) && !dept.isActive;
}

/**
 * Ministérios inativos são invisíveis para membros comuns.
 * Apenas admins (pastor / suporte) podem ver e gerenciar inativos.
 */
export function isDeptVisibleTo(session: TokenPayload | null, dept: DeptSummary): boolean {
  if (!session) return false;
  if (dept.isActive) return true;
  return canManage(session);
}

// ─── Conflict error parsing ───────────────────────────────────────────────────

/**
 * Extrai motivos legíveis de um erro 409 ao tentar inativar.
 * O backend retorna mensagens como: "X membros ativos e Y escalas futuras".
 */
export function parseConflictReasons(msg: string): string[] {
  const reasons: string[] = [];

  const memberMatch = msg.match(/(\d+)\s+membro/);
  if (memberMatch) {
    const n = parseInt(memberMatch[1], 10);
    reasons.push(
      `${n} membro${n === 1 ? '' : 's'} ativo${n === 1 ? '' : 's'} vinculado${n === 1 ? '' : 's'} ao ministério`,
    );
  }

  const scheduleMatch = msg.match(/(\d+)\s+escala/);
  if (scheduleMatch) {
    const n = parseInt(scheduleMatch[1], 10);
    reasons.push(
      `${n} escala${n === 1 ? '' : 's'} futura${n === 1 ? '' : 's'} já agendada${n === 1 ? '' : 's'}`,
    );
  }

  return reasons.length > 0 ? reasons : [msg];
}

// ─── Schedule field permissions ───────────────────────────────────────────────

export interface ScheduleSummary {
  ministerId: string | null;
}

/** Somente o Ministro Responsável daquela escala pode preencher os campos. */
export function canEditFields(
  session: TokenPayload | null,
  schedule: ScheduleSummary,
): boolean {
  if (!session || !schedule.ministerId) return false;
  return session.sub === schedule.ministerId;
}

/**
 * Pode visualizar campos (somente leitura):
 * admin, líder do ministério, ou o próprio ministro responsável.
 */
export function canViewFields(
  session: TokenPayload | null,
  deptLeaderId: string | null,
  schedule: ScheduleSummary,
): boolean {
  if (!session) return false;
  if (canManage(session)) return true;
  if (session.role === 'lider' && session.sub === deptLeaderId) return true;
  if (session.sub === schedule.ministerId) return true;
  return false;
}
