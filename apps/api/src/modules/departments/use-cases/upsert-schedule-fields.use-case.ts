import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UpsertScheduleFieldsDto } from '../dto/upsert-schedule-fields.dto';

@Injectable()
export class UpsertScheduleFieldsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    churchId: string,
    scheduleId: string,
    dto: UpsertScheduleFieldsDto,
    operator: AuthenticatedUser,
  ) {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id: scheduleId, churchId },
      select: { id: true, ministerId: true, departmentId: true },
    });

    if (!schedule) throw new NotFoundException('Escala não encontrada.');

    if (schedule.ministerId !== operator.id) {
      throw new ForbiddenException(
        'Apenas o Ministro Responsável da escala pode preencher os campos.',
      );
    }

    if (dto.fields.length === 0) {
      return { updated: 0 };
    }

    const fieldIds = dto.fields.map((f) => f.departmentFieldId);

    // Garante que todos os campos pertencem ao ministério desta escala
    const validFields = await this.prisma.departmentField.findMany({
      where: {
        id: { in: fieldIds },
        departmentId: schedule.departmentId,
      },
      select: { id: true },
    });

    const validFieldIds = new Set(validFields.map((f) => f.id));
    const invalid = fieldIds.filter((id) => !validFieldIds.has(id));

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Campo(s) não pertencente(s) ao ministério desta escala: ${invalid.join(', ')}`,
      );
    }

    // Upsert: atualiza se já existe, cria se não existe
    await this.prisma.$transaction(
      dto.fields.map((f) =>
        this.prisma.scheduleFieldValue.upsert({
          where: {
            scheduleId_departmentFieldId: {
              scheduleId,
              departmentFieldId: f.departmentFieldId,
            },
          },
          create: {
            scheduleId,
            departmentFieldId: f.departmentFieldId,
            value: f.value,
            filledBy: operator.id,
          },
          update: {
            value: f.value,
            filledBy: operator.id,
          },
        }),
      ),
    );

    return { updated: dto.fields.length };
  }
}
