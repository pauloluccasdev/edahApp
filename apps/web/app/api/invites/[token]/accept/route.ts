import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

type Params = { params: Promise<{ token: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Corpo inválido' }, { status: 400 });

  const res = await fetch(`${API_URL}/api/invites/${token}/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res) return NextResponse.json({ message: 'Erro de conexão com o servidor' }, { status: 503 });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  }

  const data = await res.json();
  const response = NextResponse.json({ ok: true, user: data.user, church: data.church });
  response.cookies.set('edah_token', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
