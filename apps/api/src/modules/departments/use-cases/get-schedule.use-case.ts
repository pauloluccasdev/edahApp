import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class GetScheduleUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(churchId: string, scheduleId: string, operator: AuthenticatedUser) {
    if (!operator.isSuporte && operator.churchId !== churchId) {
      throw new ForbiddenException('Sem permissão para acessar esta igreja.');
    }

    const schedule = await this.prisma.schedule.findFirst({
      where: { id: scheduleId, churchId },
      select: {
        id: true,
        scheduleInfo: true,
        ministerId: true,
        minister: { select: { id: true, name: true } },
        event: { select: { id: true, title: true, startsAt: true } },
        department: { select: { id: true, name: true, template: true } },
      },
    });

    if (!schedule) throw new NotFoundException('Escala não encontrada.');

    return schedule;
  }
}
