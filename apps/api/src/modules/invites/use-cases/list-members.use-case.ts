import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { assertChurchAccess } from '../../churches/utils/church-access.util';

@Injectable()
export class ListMembersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(churchId: string, operator: AuthenticatedUser) {
    assertChurchAccess(operator, churchId);

    const assignments = await this.prisma.churchRoleAssignment.findMany({
      where: { churchId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
            departmentMembers: {
              where: { churchId },
              include: { department: { select: { id: true, name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return assignments.map(({ user, role, createdAt }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role,
      joinedAt: createdAt,
      departments: user.departmentMembers.map((dm) => dm.department),
    }));
  }
}
