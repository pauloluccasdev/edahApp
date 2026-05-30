import { getSession } from '@/lib/auth';
import { CamposEscalaClient } from './CamposEscalaClient';
import styles from './page.module.css';

type Props = { params: Promise<{ scheduleId: string }> };

export default async function CamposEscalaPage({ params }: Props) {
  const [session, { scheduleId }] = await Promise.all([getSession(), params]);

  return (
    <div className={styles.root}>
      <CamposEscalaClient scheduleId={scheduleId} session={session} />
    </div>
  );
}
