import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class GetDepartmentUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(churchId: string, departmentId: string, operator: AuthenticatedUser) {
    this.assertTenantAccess(operator, churchId);

    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, churchId },
      select: {
        id: true,
        name: true,
        description: true,
        template: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        leader: { select: { id: true, name: true, avatarUrl: true } },
        fields: {
          select: { id: true, label: true, order: true },
          orderBy: { order: 'asc' },
        },
        members: {
          select: {
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                churchRoles: {
                  where: { churchId },
                  select: { role: true },
                  take: 1,
                },
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!dept) throw new NotFoundException('Ministério não encontrado.');

    return dept;
  }

  private assertTenantAccess(operator: AuthenticatedUser, churchId: string): void {
    if (operator.isSuporte) return;
    if (operator.churchId === churchId) return;
    throw new ForbiddenException('Sem permissão para acessar esta igreja.');
  }
}
