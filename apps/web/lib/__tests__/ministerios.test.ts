import { describe, expect, it } from 'vitest';

import {
  canDeactivateDept,
  canDeleteDept,
  canEditDept,
  canEditFields,
  canManage,
  canViewFields,
  getFixedFields,
  isDeptVisibleTo,
  isLeaderRequired,
  moveField,
  parseConflictReasons,
  reorderFields,
  TEMPLATE_FIXED_FIELDS,
} from '../ministerios';
import type { TokenPayload } from '../auth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function session(overrides: Partial<TokenPayload> & { role: string }): TokenPayload {
  return {
    sub:        'user-1',
    email:      'test@test.com',
    name:       'Test User',
    avatarUrl:  null,
    churchId:   'church-1',
    churchName: 'Igreja Teste',
    isSuporte:  false,
    ...overrides,
  };
}

const PASTOR   = session({ role: 'pastor_central' });
const AUXILIAR = session({ role: 'pastor_auxiliar' });
const LIDER    = session({ role: 'lider', sub: 'lider-1' });
const MEMBRO   = session({ role: 'membro', sub: 'membro-1' });
const SUPORTE  = session({ role: 'membro', isSuporte: true });

// ─── 1. Template → fixed fields preview ───────────────────────────────────────

describe('getFixedFields — preview de campos do template', () => {
  it('dança exibe apenas Figurino', () => {
    expect(getFixedFields('danca')).toEqual(['Figurino']);
  });

  it('templates sem campos fixos retornam array vazio', () => {
    const semCampos = ['louvor', 'gc', 'midia', 'discipulado', 'adolescentes', 'cronograma_culto', 'personalizado'];
    for (const t of semCampos) {
      expect(getFixedFields(t)).toEqual([]);
    }
  });

  it('template desconhecido retorna array vazio', () => {
    expect(getFixedFields('nao_existe')).toEqual([]);
  });

  it('TEMPLATE_FIXED_FIELDS cobre todos os templates conhecidos', () => {
    const templates = Object.keys(TEMPLATE_FIXED_FIELDS);
    expect(templates).toContain('danca');
    expect(templates).toContain('louvor');
    expect(templates).toContain('cronograma_culto');
    expect(templates.length).toBe(8);
  });
});

// ─── 2 & 3. Exigência de líder por template ───────────────────────────────────

describe('isLeaderRequired — exigência de líder no formulário', () => {
  it('cronograma_culto não exige líder', () => {
    expect(isLeaderRequired('cronograma_culto')).toBe(false);
  });

  it('louvor exige líder', () => {
    expect(isLeaderRequired('louvor')).toBe(true);
  });

  it('danca exige líder', () => {
    expect(isLeaderRequired('danca')).toBe(true);
  });

  it('gc exige líder', () => {
    expect(isLeaderRequired('gc')).toBe(true);
  });

  it('midia exige líder', () => {
    expect(isLeaderRequired('midia')).toBe(true);
  });

  it('discipulado exige líder', () => {
    expect(isLeaderRequired('discipulado')).toBe(true);
  });

  it('adolescentes exige líder', () => {
    expect(isLeaderRequired('adolescentes')).toBe(true);
  });

  it('personalizado exige líder', () => {
    expect(isLeaderRequired('personalizado')).toBe(true);
  });
});

// ─── 4. Drag-and-drop de campos customizáveis ─────────────────────────────────

describe('reorderFields — drag-and-drop reordena campos', () => {
  const fields = ['A', 'B', 'C', 'D'];

  it('move primeiro item para o último', () => {
    expect(reorderFields(fields, 0, 3)).toEqual(['B', 'C', 'D', 'A']);
  });

  it('move último item para o primeiro', () => {
    expect(reorderFields(fields, 3, 0)).toEqual(['D', 'A', 'B', 'C']);
  });

  it('move item do meio para outro ponto do meio', () => {
    expect(reorderFields(fields, 1, 3)).toEqual(['A', 'C', 'D', 'B']);
  });

  it('não altera a lista quando índices são iguais', () => {
    expect(reorderFields(fields, 2, 2)).toEqual(fields);
  });

  it('não muta o array original', () => {
    const original = ['X', 'Y', 'Z'];
    reorderFields(original, 0, 2);
    expect(original).toEqual(['X', 'Y', 'Z']);
  });
});

describe('moveField — botões cima/baixo reordenam campos', () => {
  const fields = ['A', 'B', 'C'];

  it('move item para cima', () => {
    expect(moveField(fields, 2, 'up')).toEqual(['A', 'C', 'B']);
  });

  it('move item para baixo', () => {
    expect(moveField(fields, 0, 'down')).toEqual(['B', 'A', 'C']);
  });

  it('não move além do início', () => {
    expect(moveField(fields, 0, 'up')).toEqual(fields);
  });

  it('não move além do fim', () => {
    expect(moveField(fields, 2, 'down')).toEqual(fields);
  });

  it('não muta o array original', () => {
    const original = ['X', 'Y', 'Z'];
    moveField(original, 0, 'down');
    expect(original).toEqual(['X', 'Y', 'Z']);
  });
});

// ─── 5. Inativar com impedimento exibe erro detalhado ─────────────────────────

describe('parseConflictReasons — erros detalhados de inativação', () => {
  it('extrai membros e escalas quando ambos presentes', () => {
    const msg = 'Não é possível inativar: 3 membros ativos e 2 escalas futuras';
    const reasons = parseConflictReasons(msg);
    expect(reasons).toHaveLength(2);
    expect(reasons[0]).toContain('3 membros');
    expect(reasons[1]).toContain('2 escalas');
  });

  it('usa singular para 1 membro', () => {
    const reasons = parseConflictReasons('1 membro ativo vinculado');
    expect(reasons[0]).toBe('1 membro ativo vinculado ao ministério');
  });

  it('usa plural para 2 membros', () => {
    const reasons = parseConflictReasons('2 membros ativos');
    expect(reasons[0]).toBe('2 membros ativos vinculados ao ministério');
  });

  it('usa singular para 1 escala', () => {
    const reasons = parseConflictReasons('1 escala futura agendada');
    expect(reasons[0]).toBe('1 escala futura já agendada');
  });

  it('usa plural para 3 escalas', () => {
    const reasons = parseConflictReasons('3 escalas futuras');
    expect(reasons[0]).toBe('3 escalas futuras já agendadas');
  });

  it('extrai apenas membros quando não há escalas', () => {
    const reasons = parseConflictReasons('5 membros ativos');
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toContain('5 membros');
  });

  it('retorna a mensagem original quando não reconhece o padrão', () => {
    const msg = 'Erro inesperado';
    expect(parseConflictReasons(msg)).toEqual([msg]);
  });
});

// ─── 6. Deletar: visível só para inativos com permissão correta ───────────────

describe('canDeleteDept — visibilidade do botão deletar', () => {
  const inativo = { isActive: false, leader: null };
  const ativo   = { isActive: true,  leader: null };
  const inativoComLider = { isActive: false, leader: { id: 'lider-1' } };

  it('pastor central pode deletar ministério inativo', () => {
    expect(canDeleteDept(PASTOR, inativo)).toBe(true);
  });

  it('pastor auxiliar pode deletar ministério inativo', () => {
    expect(canDeleteDept(AUXILIAR, inativo)).toBe(true);
  });

  it('suporte pode deletar ministério inativo', () => {
    expect(canDeleteDept(SUPORTE, inativo)).toBe(true);
  });

  it('pastor NÃO pode deletar ministério ativo', () => {
    expect(canDeleteDept(PASTOR, ativo)).toBe(false);
  });

  it('líder NÃO pode deletar mesmo sendo responsável pelo inativo', () => {
    const liderResponsavel = session({ role: 'lider', sub: 'lider-1' });
    expect(canDeleteDept(liderResponsavel, inativoComLider)).toBe(false);
  });

  it('membro NÃO pode deletar', () => {
    expect(canDeleteDept(MEMBRO, inativo)).toBe(false);
  });

  it('session null retorna false', () => {
    expect(canDeleteDept(null, inativo)).toBe(false);
  });
});

describe('canDeactivateDept — inativar só para ativos', () => {
  const ativo   = { isActive: true,  leader: null };
  const inativo = { isActive: false, leader: null };

  it('pastor pode inativar ministério ativo', () => {
    expect(canDeactivateDept(PASTOR, ativo)).toBe(true);
  });

  it('pastor NÃO pode inativar ministério já inativo', () => {
    expect(canDeactivateDept(PASTOR, inativo)).toBe(false);
  });

  it('membro NÃO pode inativar', () => {
    expect(canDeactivateDept(MEMBRO, ativo)).toBe(false);
  });
});

describe('canEditDept — edição por líder responsável ou admin', () => {
  const deptComLider1 = { isActive: true, leader: { id: 'lider-1' } };
  const deptSemLider  = { isActive: true, leader: null };

  it('pastor pode editar qualquer ministério', () => {
    expect(canEditDept(PASTOR, deptSemLider)).toBe(true);
  });

  it('líder pode editar seu próprio ministério', () => {
    expect(canEditDept(LIDER, deptComLider1)).toBe(true);
  });

  it('líder NÃO pode editar ministério de outro líder', () => {
    const outroLider = session({ role: 'lider', sub: 'lider-99' });
    expect(canEditDept(outroLider, deptComLider1)).toBe(false);
  });

  it('membro NÃO pode editar', () => {
    expect(canEditDept(MEMBRO, deptComLider1)).toBe(false);
  });
});

// ─── 7. Ministro preenche, líder vê somente leitura ──────────────────────────

describe('canEditFields — preenchimento pelo Ministro Responsável', () => {
  const escala = { ministerId: 'min-1' };
  const escalaSemMinistro = { ministerId: null };

  it('ministro responsável pode editar os campos', () => {
    const ministro = session({ role: 'membro', sub: 'min-1' });
    expect(canEditFields(ministro, escala)).toBe(true);
  });

  it('líder NÃO pode editar os campos (somente leitura)', () => {
    expect(canEditFields(LIDER, escala)).toBe(false);
  });

  it('pastor NÃO pode editar os campos', () => {
    expect(canEditFields(PASTOR, escala)).toBe(false);
  });

  it('membro que não é o ministro NÃO pode editar', () => {
    const outro = session({ role: 'membro', sub: 'outro-1' });
    expect(canEditFields(outro, escala)).toBe(false);
  });

  it('retorna false quando não há ministro designado', () => {
    expect(canEditFields(PASTOR, escalaSemMinistro)).toBe(false);
  });
});

describe('canViewFields — leitura por líder, pastor e ministro', () => {
  const escala         = { ministerId: 'min-1' };
  const liderDepto1    = 'lider-1';

  it('pastor pode visualizar campos', () => {
    expect(canViewFields(PASTOR, liderDepto1, escala)).toBe(true);
  });

  it('suporte pode visualizar campos', () => {
    expect(canViewFields(SUPORTE, liderDepto1, escala)).toBe(true);
  });

  it('líder responsável pelo ministério pode visualizar', () => {
    expect(canViewFields(LIDER, liderDepto1, escala)).toBe(true);
  });

  it('líder de outro ministério NÃO pode visualizar', () => {
    const outroLider = session({ role: 'lider', sub: 'lider-99' });
    expect(canViewFields(outroLider, liderDepto1, escala)).toBe(false);
  });

  it('ministro responsável pode visualizar seus próprios campos', () => {
    const ministro = session({ role: 'membro', sub: 'min-1' });
    expect(canViewFields(ministro, liderDepto1, escala)).toBe(true);
  });

  it('membro comum NÃO pode visualizar campos', () => {
    expect(canViewFields(MEMBRO, liderDepto1, escala)).toBe(false);
  });
});

// ─── 8. Membro não vê ministérios inativos na listagem ───────────────────────

describe('isDeptVisibleTo — filtro de inativos para membros', () => {
  const ativo   = { isActive: true,  leader: null };
  const inativo = { isActive: false, leader: null };

  it('membro vê ministério ativo', () => {
    expect(isDeptVisibleTo(MEMBRO, ativo)).toBe(true);
  });

  it('membro NÃO vê ministério inativo', () => {
    expect(isDeptVisibleTo(MEMBRO, inativo)).toBe(false);
  });

  it('líder NÃO vê ministério inativo de outro ministério', () => {
    expect(isDeptVisibleTo(LIDER, inativo)).toBe(false);
  });

  it('pastor vê ministério inativo', () => {
    expect(isDeptVisibleTo(PASTOR, inativo)).toBe(true);
  });

  it('pastor auxiliar vê ministério inativo', () => {
    expect(isDeptVisibleTo(AUXILIAR, inativo)).toBe(true);
  });

  it('suporte vê ministério inativo', () => {
    expect(isDeptVisibleTo(SUPORTE, inativo)).toBe(true);
  });

  it('session null retorna false', () => {
    expect(isDeptVisibleTo(null, ativo)).toBe(false);
  });
});
