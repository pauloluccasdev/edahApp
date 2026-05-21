import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

const INVITE_TTL_HOURS = 72;

@Injectable()
export class ResendInviteUseCase {
  private readonly logger = new Logger(ResendInviteUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async execute(churchId: string, inviteId: string, operator: AuthenticatedUser) {
    const invite = await this.prisma.inviteToken.findFirst({
      where: { id: inviteId, churchId },
    });

    if (!invite) throw new NotFoundException('Convite não encontrado.');

    const canResend = operator.isSuporte || invite.invitedBy === operator.id;
    if (!canResend) {
      throw new ForbiddenException('Apenas quem enviou o convite ou o Suporte pode reenviar.');
    }

    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

    // Invalida token atual e gera novo
    await this.prisma.$transaction(async (tx) => {
      await tx.inviteToken.update({
        where: { id: inviteId },
        data: { expiresAt: new Date() }, // expira imediatamente
      });

      await tx.inviteToken.create({
        data: {
          churchId: invite.churchId,
          departmentId: invite.departmentId,
          invitedBy: operator.id,
          email: invite.email,
          role: invite.role,
          expiresAt,
        },
      });
    });

    this.dispatchInviteEmail(invite.email);

    return { message: 'Convite reenviado com sucesso.' };
  }

  private dispatchInviteEmail(email: string): void {
    // TODO: enviar e-mail real com o novo link do convite
    this.logger.log(`[RESEND INVITE] ${email}`);
  }
}
