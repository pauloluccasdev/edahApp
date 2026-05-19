'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Building2, ChevronRight, Plus, Search } from 'lucide-react';
import Link from 'next/link';

import styles from './IgrejasClient.module.css';

interface Church {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  pastor: { id: string; name: string; email: string } | null;
}

interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Props {
  data: { data: Church[]; meta: Meta };
  currentPage: number;
  currentName: string;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

export function IgrejasClient({ data, currentPage, currentName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(currentName);
  const isMount = useRef(true);

  // Debounce: skip initial mount to avoid navigating on load
  useEffect(() => {
    if (isMount.current) {
      isMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const qs = new URLSearchParams();
      if (search.trim()) qs.set('name', search.trim());
      qs.set('page', '1');
      router.push(`${pathname}?${qs.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function goToPage(page: number) {
    const qs = new URLSearchParams();
    if (currentName) qs.set('name', currentName);
    qs.set('page', String(page));
    router.push(`${pathname}?${qs.toString()}`, { scroll: false });
  }

  const { data: churches, meta } = data;
  const isEmpty = churches.length === 0;

  return (
    <div className={styles.wrapper}>

      {/* ---- Header ---- */}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Igrejas</h1>
          {meta.total > 0 && (
            <span className={styles.countBadge}>{meta.total}</span>
          )}
        </div>
        <Link href="/admin/igrejas/nova" className={styles.newBtnDesktop}>
          <Plus size={16} strokeWidth={2.5} />
          Nova Igreja
        </Link>
      </div>

      {/* ---- Search ---- */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={16} strokeWidth={1.5} />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar igrejas por nome"
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ---- Content ---- */}
      {isEmpty ? (
        <EmptyState
          isFiltered={!!currentName}
          onNewChurch={() => router.push('/admin/igrejas/nova')}
        />
      ) : (
        <>
          {/* Table header — desktop only */}
          <div className={styles.tableHeader} aria-hidden="true">
            <span>Igreja</span>
            <span>Pastor Central</span>
            <span>Cadastro</span>
            <span />
          </div>

          <ul className={styles.list} role="list">
            {churches.map((church) => (
              <li key={church.id}>
                <Link href={`/admin/igrejas/${church.id}`} className={styles.row}>
                  <div className={styles.churchCell}>
                    <span className={styles.churchName}>{church.name}</span>
                  </div>

                  <div className={styles.pastorCell}>
                    {church.pastor ? (
                      <>
                        <span className={styles.pastorName}>{church.pastor.name}</span>
                        <span className={styles.pastorEmail}>{church.pastor.email}</span>
                      </>
                    ) : (
                      <span className={styles.noPastor}>Sem pastor central</span>
                    )}
                  </div>

                  <div className={styles.dateCell}>
                    <span className={styles.dateLabel}>Cadastro</span>
                    <span className={styles.dateValue}>{formatDate(church.createdAt)}</span>
                  </div>

                  <div className={styles.actionCell}>
                    <ChevronRight size={16} strokeWidth={2} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {meta.totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Página anterior"
              >
                ← Anterior
              </button>
              <span className={styles.pageInfo}>
                {currentPage} / {meta.totalPages}
              </span>
              <button
                className={styles.pageBtn}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= meta.totalPages}
                aria-label="Próxima página"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}

      {/* Mobile FAB — hidden on desktop */}
      <Link href="/admin/igrejas/nova" className={styles.fab} aria-label="Nova Igreja">
        <Plus size={20} strokeWidth={2.5} />
        <span>Nova Igreja</span>
      </Link>

    </div>
  );
}

interface EmptyStateProps {
  isFiltered: boolean;
  onNewChurch: () => void;
}

function EmptyState({ isFiltered, onNewChurch }: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Building2 size={36} strokeWidth={1} />
      </div>
      {isFiltered ? (
        <>
          <p className={styles.emptyTitle}>Nenhuma igreja encontrada</p>
          <p className={styles.emptyText}>Tente buscar por um nome diferente.</p>
        </>
      ) : (
        <>
          <p className={styles.emptyTitle}>Nenhuma igreja cadastrada</p>
          <p className={styles.emptyText}>
            Crie a primeira igreja para começar a usar a plataforma.
          </p>
          <button className={styles.emptyBtn} onClick={onNewChurch}>
            <Plus size={16} strokeWidth={2.5} />
            Nova Igreja
          </button>
        </>
      )}
    </div>
  );
}
