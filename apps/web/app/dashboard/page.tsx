import { getSession } from '@/lib/auth';
import {
  Calendar,
  Users,
  CheckSquare,
  Music,
  ChevronRight,
  TrendingUp,
  Clock,
  Star,
} from 'lucide-react';
import { SupportContextCard } from '@/components/dashboard/SupportContextCard';
import styles from './page.module.css';

const MODULES = [
  {
    href: '/dashboard/escalas',
    label: 'Escalas',
    Icon: Calendar,
    description: 'Crie e publique escalas dos ministérios com um clique',
    enabled: false,
    color: 'var(--ministry-louvor)',
    bg: 'var(--ministry-louvor-bg)',
  },
  {
    href: '/dashboard/membros',
    label: 'Membros',
    Icon: Users,
    description: 'Gerencie o cadastro e perfil de todos os membros',
    enabled: false,
    color: 'var(--ministry-gc)',
    bg: 'var(--ministry-gc-bg)',
  },
  {
    href: '/dashboard/presenca',
    label: 'Presença',
    Icon: CheckSquare,
    description: 'Registre a presença nos cultos e eventos da igreja',
    enabled: false,
    color: 'var(--ministry-midia)',
    bg: 'var(--ministry-midia-bg)',
  },
  {
    href: '/dashboard/ministerios',
    label: 'Ministérios',
    Icon: Music,
    description: 'Organize e acompanhe todos os ministérios ativos',
    enabled: false,
    color: 'var(--ministry-danca)',
    bg: 'var(--ministry-danca-bg)',
  },
] as const;

const STATS = [
  { label: 'Membros', value: '—', Icon: Users },
  { label: 'Escalas', value: '—', Icon: Calendar },
  { label: 'Presença', value: '—', Icon: TrendingUp },
] as const;

export default async function DashboardPage() {
  const session = await getSession();
  const firstName = session?.name?.split(' ')[0] ?? 'usuário';

  return (
    <div className={styles.root}>

      {/* Card de contexto — mobile only, apenas para suporte */}
      {session?.isSuporte && <SupportContextCard session={session} />}

      {/* Boas-vindas */}
      <section className={styles.welcome}>
        <div className={styles.welcomeText}>
          <h1 className={styles.greeting}>Olá, {firstName}</h1>
          {session?.churchName && (
            <p className={styles.church}>{session.churchName}</p>
          )}
        </div>
        <div className={styles.welcomeIcon} aria-hidden="true">
          <Star size={20} strokeWidth={1.5} />
        </div>
      </section>

      {/* Stats */}
      <section className={styles.statsRow}>
        {STATS.map(({ label, value, Icon }) => (
          <div key={label} className={styles.statCard}>
            <Icon size={16} strokeWidth={1.5} className={styles.statIcon} />
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
          </div>
        ))}
      </section>

      {/* Módulos */}
      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Módulos</h2>
          <span className={styles.sectionMeta}>Em desenvolvimento</span>
        </header>

        <div className={styles.moduleGrid}>
          {MODULES.map(({ href, label, Icon, description, enabled, color, bg }) => (
            <a
              key={href}
              href={enabled ? href : undefined}
              className={[styles.moduleCard, !enabled ? styles.moduleDisabled : ''].filter(Boolean).join(' ')}
              aria-disabled={!enabled}
              tabIndex={!enabled ? -1 : undefined}
            >
              <div className={styles.moduleHero} style={{ background: bg }}>
                <span className={styles.moduleIconWrap} style={{ color }}>
                  <Icon size={28} strokeWidth={1.5} />
                </span>
              </div>
              <div className={styles.moduleBody}>
                <div className={styles.moduleMeta}>
                  <p className={styles.moduleLabel}>{label}</p>
                  {!enabled
                    ? <span className={styles.moduleSoon}>Em breve</span>
                    : <ChevronRight size={14} className={styles.moduleArrow} />
                  }
                </div>
                <p className={styles.moduleDesc}>{description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Em breve */}
      <section className={styles.comingSoon}>
        <Clock size={18} strokeWidth={1.5} className={styles.comingSoonIcon} />
        <div>
          <p className={styles.comingSoonTitle}>Novidades a caminho</p>
          <p className={styles.comingSoonText}>
            Os módulos estão sendo desenvolvidos e estarão disponíveis em breve.
          </p>
        </div>
      </section>

    </div>
  );
}
