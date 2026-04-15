/** Tokens como constantes TS — úteis para lógica JS (ex: charts, canvas). */

export const colors = {
  bg: {
    base: '#080E18',
    '01':   '#0F1824',
    '02':   '#151F2E',
    '03':   '#1C2A3E',
    '04':   '#243248',
    card:   '#111A27',
  },
  brand: {
    navy:  '#0D1B2E',
    deep:  '#1B3A6B',
    mid:   '#2E5FA3',
    light: '#4A8FD4',
    pale:  '#C8DDF5',
  },
  text: {
    primary:   '#F0F4FA',
    secondary: '#8A9BB5',
    tertiary:  '#4E6080',
  },
  success:    '#1A7A4A',
  successBg:  '#0D2E1E',
  warning:    '#B87000',
  warningBg:  '#2A1E00',
  danger:     '#B83232',
  dangerBg:   '#2A0D0D',
  info:       '#4A8FD4',
  infoBg:     '#0D1E2E',
  border:     '#1E2E42',
  borderMid:  '#2A3E58',
} as const;

export const ministry = {
  louvor: { color: '#5B2DA8', bg: '#1E0D3A' },
  gc:     { color: '#0F6E56', bg: '#042E24' },
  midia:  { color: '#0F5FA3', bg: '#04213A' },
  danca:  { color: '#A82D7A', bg: '#3A0D2A' },
  disc:   { color: '#A85B0D', bg: '#3A1E04' },
  adol:   { color: '#2D7A1A', bg: '#0D2A04' },
  cron:   { color: '#7A5B1A', bg: '#2A1E04' },
} as const;

export type MinistryKey = keyof typeof ministry;
