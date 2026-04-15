export interface JwtPayload {
  sub: string;
  supabaseUserId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  churchId: string;
  churchName: string;
  role: string;
  isSuporte: boolean;
}
