import { getSession } from '@/lib/auth';
import { MembrosClient } from './MembrosClient';
import styles from './page.module.css';

export default async function MembrosPage() {
  const session = await getSession();
  return (
    <div className={styles.root}>
      <MembrosClient session={session} />
    </div>
  );
}
