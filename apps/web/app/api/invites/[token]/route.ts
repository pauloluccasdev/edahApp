import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;

  const res = await fetch(`${API_URL}/api/invites/${token}`, {
    cache: 'no-store',
  }).catch(() => null);

  if (!res) return NextResponse.json({ message: 'Erro de conexão com o servidor' }, { status: 503 });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
