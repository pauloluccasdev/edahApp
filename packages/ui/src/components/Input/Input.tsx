import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.css';

type InputState = 'default' | 'error' | 'success' | 'warning';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  state?: InputState;
  message?: string;
  hint?: string;
  leftIcon?: ReactNode;
}

const messageClass: Record<InputState, string> = {
  default: styles.hintMsg,
  error:   styles.errorMsg,
  success: styles.successMsg,
  warning: styles.warningMsg,
};

export function Input({
  label,
  state = 'default',
  message,
  hint,
  id,
  className,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const feedbackText = message ?? hint;

  return (
    <div className={[styles.wrapper, state !== 'default' ? styles[state] : ''].filter(Boolean).join(' ')}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[styles.input, className].filter(Boolean).join(' ')}
        aria-invalid={state === 'error'}
        aria-describedby={feedbackText ? `${inputId}-msg` : undefined}
        {...props}
      />
      {feedbackText && (
        <span
          id={`${inputId}-msg`}
          className={[styles.message, messageClass[state]].join(' ')}
          role={state === 'error' ? 'alert' : undefined}
        >
          {feedbackText}
        </span>
      )}
    </div>
  );
}
