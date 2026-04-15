export interface AuthenticatedUser {
  id: string;
  email: string;
  churchId: string;
  role: string;
  supabaseUserId: string;
  isSuporte: boolean;
}
