'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';

import type { TokenPayload } from '@/lib/auth';
import { BottomNav } from '@/components/layout/BottomNav';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import styles from './AdminShell.module.css';

interface Props {
  session: TokenPayload;
  children: React.ReactNode;
}

const COLLAPSED_KEY = 'admin_sidebar_collapsed';

export function AdminShell({ session, children }: Props) {
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
      <AdminSidebar session={session} collapsed={collapsed} />

      <button
        className={[styles.collapseHandle, collapsed ? styles.collapseHandleCollapsed : '']
          .filter(Boolean)
          .join(' ')}
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <ChevronLeft size={12} strokeWidth={2.5} />
      </button>

      <div className={[styles.main, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
        <AdminTopbar session={session} />
        <main className={styles.content}>{children}</main>
      </div>

      <BottomNav session={session} />
    </div>
  );
}
