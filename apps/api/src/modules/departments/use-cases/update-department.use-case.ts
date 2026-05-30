import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChurchRole, DepartmentTemplate, PrismaClient } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { DepartmentFieldSeederService } from '../services/department-field-seeder.service';

type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

const LEADER_ROLES: ChurchRole[] = [
  ChurchRole.pastor_central,
  ChurchRole.pastor_auxiliar,
  ChurchRole.lider,
];

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldSeeder: DepartmentFieldSeederService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(
    churchId: string,
    departmentId: string,
    dto: UpdateDepartmentDto,
    operator: AuthenticatedUser,
  ) {
    this.assertTenantAccess(operator, churchId);

    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, churchId },
      select: { id: true, leaderId: true, template: true },
    });

    if (!dept) throw new NotFoundException('Ministério não encontrado.');

    this.assertUpdatePermission(operator, dept.leaderId);

    if (dto.leaderId !== undefined) {
      if (dto.leaderId === null) {
        if (dept.template !== DepartmentTemplate.cronograma_culto) {
          throw new BadRequestException('leaderId é obrigatório para este template.');
        }
      } else {
        await this.assertLeaderEligible(churchId, dto.leaderId);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.department.update({
        where: { id: departmentId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.leaderId !== undefined && { leaderId: dto.leaderId }),
        },
        select: {
          id: true,
          name: true,
          description: true,
          template: true,
          isActive: true,
          leaderId: true,
          updatedAt: true,
        },
      });

      if (dto.fields !== undefined) {
        await tx.departmentField.deleteMany({ where: { departmentId } });

        if (dto.fields.length > 0) {
          await tx.departmentField.createMany({
            data: dto.fields.map((f) => ({
              departmentId,
              churchId,
              label: f.label,
              order: f.order,
            })),
          });
        }

        // Re-aplica campos fixos do template após substituição
        await this.fieldSeeder.seed(
          departmentId,
          churchId,
          dept.template,
          tx as unknown as TxClient,
        );
      }

      return result;
    });

    await this.auditLog.log({
      operatorId: operator.id,
      churchId,
      action: 'update_department',
      payload: {
        departmentId,
        changes: {
          name: dto.name,
          description: dto.description,
          leaderId: dto.leaderId,
          fieldsReplaced: dto.fields !== undefined,
        },
      },
    });

    return updated;
  }

  private assertTenantAccess(operator: AuthenticatedUser, churchId: string): void {
    if (operator.isSuporte) return;
    if (operator.churchId === churchId) return;
    throw new ForbiddenException('Sem permissão para acessar esta igreja.');
  }

  private assertUpdatePermission(operator: AuthenticatedUser, leaderId: string | null): void {
    if (operator.isSuporte) return;
    if (
      operator.role === ChurchRole.pastor_central ||
      operator.role === ChurchRole.pastor_auxiliar
    ) return;
    if (operator.role === ChurchRole.lider && operator.id === leaderId) return;
    throw new ForbiddenException('Sem permissão para editar este ministério.');
  }

  private async assertLeaderEligible(churchId: string, leaderId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: leaderId, churchId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Líder não encontrado nesta igreja.');

    const roleAssignment = await this.prisma.churchRoleAssignment.findFirst({
      where: { churchId, userId: leaderId, role: { in: LEADER_ROLES } },
    });
    if (!roleAssignment) {
      throw new ForbiddenException(
        'O líder designado deve ter papel de líder ou superior nesta igreja.',
      );
    }
  }
}
