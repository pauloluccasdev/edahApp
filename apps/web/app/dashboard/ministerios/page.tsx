import { getSession } from '@/lib/auth';
import { MinistriosClient } from './MinistriosClient';
import styles from './page.module.css';

export default async function MinistriosPage() {
  const session = await getSession();
  return (
    <div className={styles.root}>
      <MinistriosClient session={session} />
    </div>
  );
}
