import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { EditarMinisterioClient } from './EditarMinisterioClient';
import styles from './page.module.css';

type Props = { params: Promise<{ departmentId: string }> };

export default async function EditarMinisterioPage({ params }: Props) {
  const [session, { departmentId }] = await Promise.all([getSession(), params]);

  const canEdit =
    session?.isSuporte ||
    session?.role === 'pastor_central' ||
    session?.role === 'pastor_auxiliar' ||
    session?.role === 'lider';

  if (!canEdit) redirect('/dashboard/ministerios');

  return (
    <div className={styles.root}>
      <EditarMinisterioClient departmentId={departmentId} session={session} />
    </div>
  );
}
