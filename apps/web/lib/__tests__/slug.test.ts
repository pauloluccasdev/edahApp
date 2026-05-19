import { describe, expect, it } from 'vitest';

import { toSlug } from '../slug';

describe('toSlug', () => {
  it('converte espaços em hifens', () => {
    expect(toSlug('Igreja Batista Central')).toBe('igreja-batista-central');
  });

  it('remove acentos', () => {
    expect(toSlug('Igreja São Paulo')).toBe('igreja-sao-paulo');
  });

  it('remove cedilha', () => {
    expect(toSlug('Congregação')).toBe('congregacao');
  });

  it('remove caracteres especiais', () => {
    expect(toSlug('Igreja & Ministério!')).toBe('igreja-ministerio');
  });

  it('colapsa múltiplos espaços', () => {
    expect(toSlug('Igreja   Batista   Central')).toBe('igreja-batista-central');
  });

  it('remove hifens duplicados', () => {
    expect(toSlug('Igreja--Batista')).toBe('igreja-batista');
  });

  it('remove hifens no início e fim', () => {
    expect(toSlug('  Igreja  ')).toBe('igreja');
  });

  it('retorna string vazia para entrada vazia', () => {
    expect(toSlug('')).toBe('');
  });

  it('não modifica slug já válido', () => {
    expect(toSlug('minha-igreja')).toBe('minha-igreja');
  });

  it('lida com ã, õ, â, ê, î, ô, û', () => {
    expect(toSlug('Irmãos em Comunhão')).toBe('irmaos-em-comunhao');
  });

  it('converte para minúsculas', () => {
    expect(toSlug('IGREJA CENTRAL')).toBe('igreja-central');
  });
});
