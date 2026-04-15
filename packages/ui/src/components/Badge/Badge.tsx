import type { ReactNode } from 'react';
import type { MinistryKey } from '../../tokens';
import styles from './Badge.module.css';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info';
type BadgeVariant = StatusVariant | MinistryKey;

const MINISTRY_LABELS: Record<MinistryKey, string> = {
  louvor: 'Louvor',
  gc:     'GC',
  midia:  'Mídia',
  danca:  'Dança',
  disc:   'Discipulado',
  adol:   'Adolescentes',
  cron:   'Cronograma',
};

interface BadgeProps {
  variant: BadgeVariant;
  children?: ReactNode;
}

export function Badge({ variant, children }: BadgeProps) {
  const label = children ?? (variant in MINISTRY_LABELS
    ? MINISTRY_LABELS[variant as MinistryKey]
    : variant);

  return (
    <span className={[styles.badge, styles[variant]].join(' ')}>
      {label}
    </span>
  );
}
