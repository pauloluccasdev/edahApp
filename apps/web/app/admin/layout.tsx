import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { AdminShell } from '@/components/admin/AdminShell';
import { getSession } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) redirect('/auth/login');
  if (!session.isSuporte) redirect('/dashboard');

  return <AdminShell session={session}>{children}</AdminShell>;
}
