import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
  }

  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  // DEBUG — remover após resolver o problema
  console.log('[auth/login] API_URL:', apiUrl);
  console.log('[auth/login] email recebido:', body.email);
  console.log('[auth/login] password length:', body.password?.length);

  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: body.email, password: body.password }),
  }).catch((err) => {
    console.error('[auth/login] fetch para NestJS falhou:', err?.message);
    return null;
  });

  // DEBUG — remover após resolver o problema
  console.log('[auth/login] NestJS status:', res?.status ?? 'sem resposta');

  if (!res || !res.ok) {
    const data = await res?.json().catch(() => ({}));
    console.log('[auth/login] NestJS error body:', data);
    return NextResponse.json(
      { error: data?.message ?? 'E-mail ou senha incorretos' },
      { status: 401 },
    );
  }

  const payload = await res.json();
  const { accessToken } = payload;

  if (!accessToken) {
    console.error('[auth/login] NestJS retornou ok mas sem accessToken:', payload);
    return NextResponse.json({ error: 'Erro interno de autenticação' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('edah_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return response;
}
