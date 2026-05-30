import { ForbiddenException, Injectable } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class ListDepartmentsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(churchId: string, operator: AuthenticatedUser) {
    this.assertTenantAccess(operator, churchId);

    const canSeeInactive =
      operator.isSuporte ||
      operator.role === ChurchRole.pastor_central ||
      operator.role === ChurchRole.pastor_auxiliar;

    const departments = await this.prisma.department.findMany({
      where: {
        churchId,
        ...(canSeeInactive ? {} : { isActive: true }),
      },
      select: {
        id: true,
        name: true,
        template: true,
        isActive: true,
        leader: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: 'asc' },
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      template: d.template,
      isActive: d.isActive,
      leader: d.leader,
      memberCount: d._count.members,
    }));
  }

  private assertTenantAccess(operator: AuthenticatedUser, churchId: string): void {
    if (operator.isSuporte) return;
    if (operator.churchId === churchId) return;
    throw new ForbiddenException('Sem permissão para acessar esta igreja.');
  }
}
