import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ChurchSelectClient } from './ChurchSelectClient';

interface Church {
  churchId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: string;
}

async function fetchChurches(token: string): Promise<Church[] | null> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/api/me/churches`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 401) return null;
    return res.ok ? ((await res.json()) as Church[]) : [];
  } catch {
    return [];
  }
}

export default async function ChurchSelectPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('edah_token')?.value ?? '';

  const churches = await fetchChurches(token);
  if (churches === null || churches.length === 0) redirect('/auth/login');
  if (churches.length === 1) redirect('/dashboard');

  return <ChurchSelectClient churches={churches} />;
}
