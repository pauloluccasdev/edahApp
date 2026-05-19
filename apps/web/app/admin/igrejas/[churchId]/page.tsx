import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { ChurchDetailClient } from './ChurchDetailClient';

export interface ChurchDetail {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  timezone: string;
  auxiliarLimit: number;
  createdAt: string;
  pastors: Array<{ id: string; name: string; email: string; role: string }>;
}

async function fetchChurch(token: string, churchId: string): Promise<ChurchDetail | null | 'unauthorized'> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/admin/churches/${churchId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 401) return 'unauthorized';
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ChurchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { churchId } = await params;
  const { created } = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('edah_token')?.value ?? '';

  const [church, session] = await Promise.all([
    fetchChurch(token, churchId),
    getSession(),
  ]);

  if (church === 'unauthorized') redirect('/auth/login');
  if (!church || !session) notFound();

  return (
    <ChurchDetailClient
      church={church}
      showCreatedBanner={created === 'true'}
      session={{ isSuporte: session.isSuporte, role: session.role }}
    />
  );
}
