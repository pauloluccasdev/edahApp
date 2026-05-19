import { Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { assertChurchAccess } from '../utils/church-access.util';

// IMPL-08 (futuro): quando existir um endpoint genérico de remoção de pastores,
// garantir que apenas Suporte ou pastor_central possam executá-lo (RN-09).
// assertChurchAccess() já cobre esse requisito — aplicar lá quando o endpoint for criado.

@Injectable()
export class RemovePastorAuxiliarUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(churchId: string, userId: string, operator: AuthenticatedUser): Promise<void> {
    assertChurchAccess(operator, churchId);

    const assignment = await this.prisma.churchRoleAssignment.findFirst({
      where: { churchId, userId, role: ChurchRole.pastor_auxiliar },
      select: { id: true },
    });
    if (!assignment) {
      throw new NotFoundException('Pastor auxiliar não encontrado nesta igreja.');
    }

    await this.prisma.churchRoleAssignment.delete({ where: { id: assignment.id } });

    if (operator.isSuporte) {
      await this.auditLog.log({
        operatorId: operator.id,
        churchId,
        action: 'remove_pastor_auxiliar',
        payload: { removedUserId: userId },
      });
    }
  }
}
