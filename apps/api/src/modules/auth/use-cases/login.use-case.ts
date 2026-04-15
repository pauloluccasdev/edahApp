import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { TokenService } from '../services/token.service';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: LoginDto) {
    // 1. Valida credenciais no Supabase e obtém o ID do usuário Supabase
    const supabaseUserId = await this.supabaseAuth.signIn(dto.email, dto.password);

    // 2. Busca usuário interno pelo supabase_id
    const user = await this.prisma.user.findUnique({
      where: { supabaseId: supabaseUserId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não cadastrado na aplicação.');
    }

    // 3. Busca o papel do usuário e o nome da church em paralelo
    const [churchRole, church] = await Promise.all([
      this.prisma.churchRoleAssignment.findFirst({
        where: { userId: user.id, churchId: user.churchId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.church.findUnique({
        where: { id: user.churchId },
        select: { name: true },
      }),
    ]);

    const role = churchRole?.role ?? 'membro';
    const email = user.email ?? dto.email;

    // 4. Gera JWT próprio da aplicação com dados completos do perfil
    const accessToken = this.tokenService.generate({
      sub: user.id,
      supabaseUserId,
      email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      churchId: user.churchId,
      churchName: church?.name ?? '',
      role,
      isSuporte: user.isSuporte,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email,
        name: user.name,
        phone: user.phone,
        whatsapp: user.whatsapp,
        avatarUrl: user.avatarUrl,
        churchId: user.churchId,
        role,
        isSuporte: user.isSuporte,
      },
    };
  }
}
