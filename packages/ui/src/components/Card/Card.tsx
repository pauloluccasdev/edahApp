import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  conflict?: boolean;
}

interface CardHeaderProps {
  title: string;
  meta?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hasHeader?: boolean;
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ hoverable, conflict, className, children, ...props }: CardProps) {
  const classes = [
    styles.card,
    hoverable && styles.hoverable,
    conflict && styles.conflict,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, meta, icon, actions }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      {icon && <span className={styles.headerIcon}>{icon}</span>}
      <div className={styles.headerContent}>
        <p className={styles.title}>{title}</p>
        {meta && <p className={styles.meta}>{meta}</p>}
      </div>
      {actions}
    </div>
  );
}

export function CardBody({ children, hasHeader, className, ...props }: CardBodyProps) {
  return (
    <div
      className={[styles.body, hasHeader && styles.withHeader, className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
  return (
    <div className={[styles.footer, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
