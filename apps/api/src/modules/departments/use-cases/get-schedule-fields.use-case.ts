import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class GetScheduleFieldsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(churchId: string, scheduleId: string, operator: AuthenticatedUser) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id: scheduleId, churchId },
      select: {
        id: true,
        departmentId: true,
        ministerId: true,
        department: { select: { leaderId: true } },
      },
    });

    if (!schedule) throw new NotFoundException('Escala não encontrada.');

    await this.assertReadPermission(operator, churchId, schedule.department.leaderId, schedule.ministerId);

    const fieldValues = await this.prisma.scheduleFieldValue.findMany({
      where: { scheduleId },
      select: {
        id: true,
        value: true,
        createdAt: true,
        departmentField: { select: { id: true, label: true, order: true } },
        filler: { select: { id: true, name: true } },
      },
      orderBy: { departmentField: { order: 'asc' } },
    });

    // Retorna também campos ainda não preenchidos para mostrar lista completa
    const allFields = await this.prisma.departmentField.findMany({
      where: { departmentId: schedule.departmentId },
      select: { id: true, label: true, order: true },
      orderBy: { order: 'asc' },
    });

    const filledMap = new Map(fieldValues.map((fv) => [fv.departmentField.id, fv]));

    return allFields.map((field) => {
      const filled = filledMap.get(field.id);
      return {
        fieldId: field.id,
        label: field.label,
        order: field.order,
        value: filled?.value ?? null,
        filledBy: filled?.filler ?? null,
        filledAt: filled?.createdAt ?? null,
      };
    });
  }

  private async assertReadPermission(
    operator: AuthenticatedUser,
    churchId: string,
    departmentLeaderId: string | null,
    ministerId: string | null,
  ): Promise<void> {
    if (operator.isSuporte) return;

    if (operator.churchId !== churchId) {
      throw new ForbiddenException('Sem permissão para acessar esta igreja.');
    }

    if (
      operator.role === ChurchRole.pastor_central ||
      operator.role === ChurchRole.pastor_auxiliar
    ) return;

    if (operator.role === ChurchRole.lider && operator.id === departmentLeaderId) return;

    if (operator.id === ministerId) return;

    throw new ForbiddenException(
      'Apenas o líder do ministério, pastores, o ministro responsável e Suporte podem visualizar os campos preenchidos.',
    );
  }
}
