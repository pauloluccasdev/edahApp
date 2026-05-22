import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOGIN_PATH = '/auth/login';
const PUBLIC_PATHS = [LOGIN_PATH, '/esqueceu-senha', '/invite'];
// Rotas públicas onde usuários autenticados NÃO devem ser redirecionados ao dashboard
// (ex: aceitar convite mesmo estando logado)
const AUTH_PASSTHROUGH = ['/invite'];
const AUTH_REDIRECT = '/dashboard';

function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64)) as { exp?: number };
    if (!decoded.exp) return false;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('edah_token')?.value;

  // Token expirado: limpa o cookie e redireciona para login
  if (token && isTokenExpired(token)) {
    const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    response.cookies.delete('edah_token');
    return response;
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPassthrough = AUTH_PASSTHROUGH.some((p) => pathname.startsWith(p));

  // Já autenticado tentando acessar página pública → redireciona pro dashboard
  // Exceto rotas de passthrough (ex: /invite) onde o usuário logado também pode acessar
  if (isPublic && token && !isAuthPassthrough) {
    return NextResponse.redirect(new URL(AUTH_REDIRECT, request.url));
  }

  // Rota protegida sem token → redireciona pro login
  if (!isPublic && !token) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
