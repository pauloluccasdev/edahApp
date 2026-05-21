import { ConflictException, GoneException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ValidateInviteUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(token: string) {
    const invite = await this.prisma.inviteToken.findUnique({
      where: { token },
      include: { church: { select: { name: true } } },
    });

    if (!invite) throw new NotFoundException('Convite não encontrado.');

    if (invite.usedAt) {
      throw new ConflictException('Este convite já foi utilizado.');
    }

    if (invite.expiresAt < new Date()) {
      throw new GoneException({ message: 'Este convite expirou.', expired: true });
    }

    return {
      email: invite.email,
      role: invite.role,
      churchName: invite.church.name,
    };
  }
}
