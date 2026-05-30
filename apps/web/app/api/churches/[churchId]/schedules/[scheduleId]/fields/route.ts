import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

type Params = { params: Promise<{ churchId: string; scheduleId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { churchId, scheduleId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('edah_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });

  const res = await fetch(
    `${API_URL}/api/churches/${churchId}/schedules/${scheduleId}/fields`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  ).catch(() => null);

  if (!res) return NextResponse.json({ message: 'Erro de conexão com o servidor' }, { status: 503 });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { churchId, scheduleId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('edah_token')?.value;
  if (!token) return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);

  const res = await fetch(
    `${API_URL}/api/churches/${churchId}/schedules/${scheduleId}/fields`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  ).catch(() => null);

  if (!res) return NextResponse.json({ message: 'Erro de conexão com o servidor' }, { status: 503 });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
