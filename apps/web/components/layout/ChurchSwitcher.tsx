'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useChurch } from '@/lib/church-context';
import styles from './ChurchSwitcher.module.css';

export function ChurchSwitcher() {
  const { churches, activeChurch, setActiveChurch, isLoading } = useChurch();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (isLoading || churches.length <= 1) return null;

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Trocar de igreja"
      >
        <span className={styles.triggerName}>{activeChurch?.name ?? '—'}</span>
        <ChevronDown size={13} strokeWidth={2} className={[styles.chevron, open ? styles.chevronOpen : ''].filter(Boolean).join(' ')} />
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox" aria-label="Selecionar igreja">
          {churches.map((church) => {
            const isActive = church.churchId === activeChurch?.churchId;
            return (
              <button
                key={church.churchId}
                role="option"
                aria-selected={isActive}
                className={[styles.option, isActive ? styles.optionActive : ''].filter(Boolean).join(' ')}
                onClick={() => {
                  setActiveChurch(church);
                  setOpen(false);
                }}
              >
                <span className={styles.optionName}>{church.name}</span>
                {isActive && <Check size={13} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
