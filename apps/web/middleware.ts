import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOGIN_PATH = '/auth/login';
const PUBLIC_PATHS = [LOGIN_PATH, '/esqueceu-senha'];
const AUTH_REDIRECT = '/dashboard';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('edah_token')?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Já autenticado tentando acessar página pública → redireciona pro dashboard
  if (isPublic && token) {
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
