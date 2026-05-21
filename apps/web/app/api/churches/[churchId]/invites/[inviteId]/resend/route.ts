import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

type Params = { params: Promise<{ churchId: string; inviteId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { churchId, inviteId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('edah_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });

  const res = await fetch(`${API_URL}/api/churches/${churchId}/invites/${inviteId}/resend`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  if (!res) return NextResponse.json({ message: 'Erro de conexão com o servidor' }, { status: 503 });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
