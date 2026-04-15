import type { ReactNode } from 'react';
import styles from './Toast.module.css';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  variant: ToastVariant;
  title: string;
  description?: string;
  icon?: ReactNode;
  onClose?: () => void;
}

const DEFAULT_ICONS: Record<ToastVariant, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

export function Toast({ variant, title, description, icon, onClose }: ToastProps) {
  return (
    <div
      className={[styles.toast, styles[variant]].join(' ')}
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon ?? DEFAULT_ICONS[variant]}
      </span>

      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
      </div>

      {onClose && (
        <button
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar notificação"
        >
          ✕
        </button>
      )}
    </div>
  );
}
