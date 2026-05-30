import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { NovoMinisterioClient } from './NovoMinisterioClient';
import styles from './page.module.css';

export default async function NovoMinisterioPage() {
  const session = await getSession();

  const canCreate =
    session?.isSuporte ||
    session?.role === 'pastor_central' ||
    session?.role === 'pastor_auxiliar';

  if (!canCreate) redirect('/dashboard/ministerios');

  return (
    <div className={styles.root}>
      <NovoMinisterioClient />
    </div>
  );
}
