import { Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { assertChurchAccess } from '../utils/church-access.util';

@Injectable()
export class GetChurchUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(churchId: string, operator: AuthenticatedUser) {
    assertChurchAccess(operator, churchId);

    const church = await this.prisma.church.findUnique({
      where: { id: churchId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        timezone: true,
        auxiliarLimit: true,
        createdAt: true,
        updatedAt: true,
        churchRoles: {
          where: { role: { in: [ChurchRole.pastor_central, ChurchRole.pastor_auxiliar] } },
          select: {
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!church) throw new NotFoundException('Igreja não encontrada.');

    const { churchRoles, ...churchData } = church;

    return {
      ...churchData,
      pastors: churchRoles.map(({ role, user }) => ({ ...user, role })),
    };
  }
}
