import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class DeactivateDepartmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(churchId: string, departmentId: string, operator: AuthenticatedUser) {
    this.assertTenantAccess(operator, churchId);

    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, churchId },
      select: { id: true, name: true, leaderId: true, isActive: true },
    });

    if (!dept) throw new NotFoundException('Ministério não encontrado.');

    this.assertPermission(operator, dept.leaderId);

    if (!dept.isActive) {
      return { message: 'Ministério já está inativo.' };
    }

    await this.assertCanDeactivate(departmentId);

    await this.prisma.department.update({
      where: { id: departmentId },
      data: { isActive: false },
    });

    await this.auditLog.log({
      operatorId: operator.id,
      churchId,
      action: 'deactivate_department',
      payload: { departmentId, name: dept.name },
    });

    return { message: 'Ministério inativado com sucesso.' };
  }

  private async assertCanDeactivate(departmentId: string): Promise<void> {
    const impediments: string[] = [];

    const memberCount = await this.prisma.departmentMember.count({
      where: { departmentId },
    });
    if (memberCount > 0) {
      impediments.push(
        `${memberCount} membro(s) ativo(s) vinculado(s) ao ministério`,
      );
    }

    const futureScheduleCount = await this.prisma.schedule.count({
      where: {
        departmentId,
        event: { startsAt: { gt: new Date() } },
      },
    });
    if (futureScheduleCount > 0) {
      impediments.push(
        `${futureScheduleCount} escala(s) futura(s) vinculada(s) ao ministério`,
      );
    }

    if (impediments.length > 0) {
      throw new ConflictException(
        `Não é possível inativar o ministério: ${impediments.join(' e ')}.`,
      );
    }
  }

  private assertPermission(operator: AuthenticatedUser, leaderId: string | null): void {
    if (operator.isSuporte) return;
    if (
      operator.role === ChurchRole.pastor_central ||
      operator.role === ChurchRole.pastor_auxiliar
    ) return;
    if (operator.role === ChurchRole.lider && operator.id === leaderId) return;
    throw new ForbiddenException('Sem permissão para inativar este ministério.');
  }

  private assertTenantAccess(operator: AuthenticatedUser, churchId: string): void {
    if (operator.isSuporte) return;
    if (operator.churchId === churchId) return;
    throw new ForbiddenException('Sem permissão para acessar esta igreja.');
  }
}
