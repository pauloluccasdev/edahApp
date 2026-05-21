import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('edah_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });

  const res = await fetch(`${API_URL}/api/me/churches`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  }).catch(() => null);

  if (!res) return NextResponse.json({ message: 'Erro de conexão com o servidor' }, { status: 503 });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
