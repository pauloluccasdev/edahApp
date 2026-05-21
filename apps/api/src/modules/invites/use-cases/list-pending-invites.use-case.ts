import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { assertChurchAccess } from '../../churches/utils/church-access.util';

@Injectable()
export class ListPendingInvitesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(churchId: string, operator: AuthenticatedUser) {
    assertChurchAccess(operator, churchId);

    const now = new Date();

    const invites = await this.prisma.inviteToken.findMany({
      where: { churchId, usedAt: null },
      include: {
        inviter: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      department: invite.department,
      invitedBy: invite.inviter,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      expired: invite.expiresAt < now,
      canResend: operator.isSuporte || invite.invitedBy === operator.id,
    }));
  }
}
