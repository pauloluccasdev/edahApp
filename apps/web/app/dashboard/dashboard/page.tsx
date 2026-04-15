import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import styles from './page.module.css';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) redirect('/login');

  return (
    <main className={styles.root}>
      <p className={styles.eyebrow}>Painel</p>
      <h1 className={styles.heading}>
        Seja bem-vindo, <span className={styles.name}>{session.name}</span>
      </h1>
      <p className={styles.sub}>{session.email}</p>
    </main>
  );
}
