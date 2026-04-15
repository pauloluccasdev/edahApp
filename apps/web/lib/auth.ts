import { cookies } from 'next/headers';

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  churchId: string;
  churchName: string;
  role: string;
  isSuporte: boolean;
}

/** Decodifica o payload do JWT sem verificar a assinatura (já validado pelo middleware). */
function decodeToken(token: string): TokenPayload | null {
  try {
    const [, payload] = token.split('.');
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

/** Retorna o payload do token do cookie, ou null se não autenticado. */
export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('edah_token')?.value;
  if (!token) return null;
  return decodeToken(token);
}
