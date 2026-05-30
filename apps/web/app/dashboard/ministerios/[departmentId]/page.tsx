import { getSession } from '@/lib/auth';
import { DetalheMinisterioClient } from './DetalheMinisterioClient';
import styles from './page.module.css';

type Props = { params: Promise<{ departmentId: string }> };

export default async function DetalheMinisterioPage({ params }: Props) {
  const [session, { departmentId }] = await Promise.all([getSession(), params]);

  return (
    <div className={styles.root}>
      <DetalheMinisterioClient departmentId={departmentId} session={session} />
    </div>
  );
}
