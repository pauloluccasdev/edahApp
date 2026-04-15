export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  churchId: string;
  churchName: string;
  role: string;
  supabaseUserId: string;
  isSuporte: boolean;
}
