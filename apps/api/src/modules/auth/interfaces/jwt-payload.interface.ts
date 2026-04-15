export interface JwtPayload {
  sub: string;
  supabaseUserId: string;
  email: string;
  churchId: string;
  role: string;
  isSuporte: boolean;
}
