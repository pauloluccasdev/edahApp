import { ConflictException, GoneException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { TokenService } from '../../auth/services/token.service';
import { SupabaseAuthService } from '../../auth/services/supabase-auth.service';
import { AcceptInviteDto } from '../dto/accept-invite.dto';

@Injectable()
export class AcceptInviteUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(token: string, dto: AcceptInviteDto) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: { church: { select: { id: true, name: true } } },
    });

    if (!invite) throw new NotFoundException('Convite não encontrado.');

    if (invite.usedAt) {
      throw new ConflictException('Este convite já foi utilizado.');
    }

    if (invite.expiresAt < new Date()) {
      throw new GoneException({ message: 'Este convite expirou.', expired: true });
    }

    const supabaseUserId = await this.supabaseAuth.createUser(invite.email, dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          churchId: invite.churchId,
          name: dto.name,
          email: invite.email,
          supabaseId: supabaseUserId,
        },
        select: { id: true, name: true, email: true },
      });

      await tx.churchRoleAssignment.create({
        data: { churchId: invite.churchId, userId: newUser.id, role: invite.role },
      });

      if (invite.departmentId) {
        await tx.departmentMember.create({
          data: { churchId: invite.churchId, departmentId: invite.departmentId, userId: newUser.id },
        });
      }

      await tx.inviteToken.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      return newUser;
    });

    const accessToken = this.tokenService.generate({
      sub: user.id,
      supabaseUserId,
      email: invite.email,
      name: dto.name,
      avatarUrl: null,
      churchId: invite.churchId,
      churchName: invite.church.name,
      role: invite.role,
      isSuporte: false,
    });

    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email },
      church: invite.church,
    };
  }
}
