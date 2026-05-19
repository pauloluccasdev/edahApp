import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { IgrejasClient } from './IgrejasClient';
import styles from './page.module.css';

interface Church {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  pastor: { id: string; name: string; email: string } | null;
}

interface ChurchListResponse {
  data: Church[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const EMPTY: ChurchListResponse = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
};

async function fetchChurches(
  token: string,
  page: number,
  name: string,
): Promise<ChurchListResponse | null> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
  const qs = new URLSearchParams({ page: String(page), limit: '20' });
  if (name) qs.set('name', name);

  try {
    const res = await fetch(`${apiUrl}/api/admin/churches?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (res.status === 401) return null;
    return res.ok ? ((await res.json()) as ChurchListResponse) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export default async function IgrejasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; name?: string }>;
}) {
  const { page: pageParam, name: nameParam } = await searchParams;

  const page = Math.max(1, Number(pageParam ?? 1));
  const name = nameParam ?? '';

  const cookieStore = await cookies();
  const token = cookieStore.get('edah_token')?.value ?? '';

  const result = await fetchChurches(token, page, name);
  if (result === null) redirect('/auth/login');

  return (
    <div className={styles.root}>
      <IgrejasClient data={result} currentPage={page} currentName={name} />
    </div>
  );
}
