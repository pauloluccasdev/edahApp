import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class ListDepartmentSchedulesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(churchId: string, departmentId: string, operator: AuthenticatedUser) {
    if (!operator.isSuporte && operator.churchId !== churchId) {
      throw new ForbiddenException('Sem permissão para acessar esta igreja.');
    }

    return this.prisma.schedule.findMany({
      where: { departmentId, churchId },
      select: {
        id: true,
        scheduleInfo: true,
        minister: { select: { id: true, name: true } },
        event: { select: { id: true, title: true, startsAt: true } },
      },
      orderBy: { event: { startsAt: 'desc' } },
      take: 5,
    });
  }
}
