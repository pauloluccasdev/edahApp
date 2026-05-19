'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { TokenPayload } from '@/lib/auth';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import styles from './AppShell.module.css';

interface Props {
  session: TokenPayload;
  children: React.ReactNode;
}

const COLLAPSED_KEY = 'sidebar_collapsed';

export function AppShell({ session, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <div className={styles.shell}>
      <Sidebar session={session} collapsed={collapsed} />

      <button
        className={[styles.collapseHandle, collapsed ? styles.collapseHandleCollapsed : ''].filter(Boolean).join(' ')}
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <ChevronLeft size={12} strokeWidth={2.5} />
      </button>

      <div className={[styles.main, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
        <Topbar session={session} />
        <main className={styles.content}>{children}</main>
      </div>

      <BottomNav session={session} />
    </div>
  );
}
