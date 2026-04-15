'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import type { TokenPayload } from '@/lib/auth';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppShell.module.css';

interface Props {
  session: TokenPayload;
  children: React.ReactNode;
}

const COLLAPSED_KEY = 'sidebar_collapsed';

export function AppShell({ session, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  function openMobile() {
    setMobileOpen(true);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className={styles.shell}>
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <Sidebar
        session={session}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={closeMobile}
      />

      {/* Floating collapse handle — on the sidebar border, desktop only */}
      <button
        className={[styles.collapseHandle, collapsed ? styles.collapseHandleCollapsed : ''].filter(Boolean).join(' ')}
        onClick={toggleCollapse}
        aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <ChevronLeft size={12} strokeWidth={2.5} />
      </button>

      <div className={[styles.main, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
        <Topbar session={session} onMenuToggle={openMobile} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
