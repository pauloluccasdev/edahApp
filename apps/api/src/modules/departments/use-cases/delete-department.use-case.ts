import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class DeleteDepartmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(churchId: string, departmentId: string, operator: AuthenticatedUser) {
    this.assertPermission(operator, churchId);

    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, churchId },
      select: { id: true, name: true, isActive: true },
    });

    if (!dept) throw new NotFoundException('Ministério não encontrado.');

    if (dept.isActive) {
      throw new ConflictException(
        'Não é possível deletar um ministério ativo. Inative-o primeiro.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // schedules tem FK RESTRICT → precisa deleção explícita.
      // Filhos (schedule_members, schedule_substitutions, songs, rehearsals,
      // rehearsal_reminders, schedule_field_values) cascadeiam automaticamente.
      await tx.schedule.deleteMany({ where: { departmentId } });

      // department_fields, department_members, event_departments,
      // event_notifications e availability cascadeiam automaticamente.
      // invite_tokens.department_id vira NULL (SET NULL na FK).
      await tx.department.delete({ where: { id: departmentId } });
    });

    await this.auditLog.log({
      operatorId: operator.id,
      churchId,
      action: 'delete_department',
      payload: { departmentId, name: dept.name },
    });

    return { message: 'Ministério deletado com sucesso.' };
  }

  private assertPermission(operator: AuthenticatedUser, churchId: string): void {
    if (operator.isSuporte) return;
    if (
      (operator.role === ChurchRole.pastor_central ||
        operator.role === ChurchRole.pastor_auxiliar) &&
      operator.churchId === churchId
    ) return;
    throw new ForbiddenException('Sem permissão para deletar ministérios nesta igreja.');
  }
}
