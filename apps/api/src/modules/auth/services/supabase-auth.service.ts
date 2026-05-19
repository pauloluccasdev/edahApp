import { Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(private readonly configService: ConfigService) {
    const url = configService.getOrThrow<string>('SUPABASE_URL');
    const serviceKey = configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');

    this.client = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  async signIn(email: string, password: string): Promise<string> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      this.logger.warn(`Supabase signIn falhou — código: ${error?.code} | mensagem: ${error?.message}`);
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return data.user.id;
  }

  async createUser(email: string, password: string): Promise<string> {
    const { data, error } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error || !data.user) {
      throw new InternalServerErrorException('Erro ao criar usuário no provedor de identidade.');
    }

    return data.user.id;
  }

  async inviteUser(email: string): Promise<{ supabaseId: string; inviteLink: string }> {
    const { data, error } = await this.client.auth.admin.generateLink({
      type: 'invite',
      email,
    });

    if (error || !data.user) {
      throw new InternalServerErrorException('Erro ao enviar convite de acesso ao usuário.');
    }

    return { supabaseId: data.user.id, inviteLink: data.properties.action_link };
  }

  async deleteUser(supabaseUserId: string): Promise<void> {
    await this.client.auth.admin.deleteUser(supabaseUserId);
  }
}
