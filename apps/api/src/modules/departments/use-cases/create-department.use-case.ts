import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRole, DepartmentTemplate, PrismaClient } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { assertChurchAccess } from '../../churches/utils/church-access.util';
import { CreateDepartmentDto } from '../dto/create-department.dto';
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
export class CreateDepartmentUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldSeeder: DepartmentFieldSeederService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(churchId: string, dto: CreateDepartmentDto, operator: AuthenticatedUser) {
    assertChurchAccess(operator, churchId);

    if (dto.template !== DepartmentTemplate.cronograma_culto && !dto.leaderId) {
      throw new BadRequestException('leaderId é obrigatório para este template.');
    }

    if (dto.leaderId) {
      await this.assertLeaderEligible(churchId, dto.leaderId);
    }

    const department = await this.prisma.$transaction(async (tx) => {
      const dept = await tx.department.create({
        data: {
          churchId,
          name: dto.name,
          description: dto.description ?? null,
          leaderId: dto.leaderId ?? null,
          template: dto.template,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          template: true,
          isActive: true,
          leaderId: true,
          createdAt: true,
        },
      });

      if (dto.fields && dto.fields.length > 0) {
        await tx.departmentField.createMany({
          data: dto.fields.map((f) => ({
            departmentId: dept.id,
            churchId,
            label: f.label,
            order: f.order,
          })),
        });
      }

      await this.fieldSeeder.seed(dept.id, churchId, dto.template, tx as unknown as TxClient);

      return dept;
    });

    await this.auditLog.log({
      operatorId: operator.id,
      churchId,
      action: 'create_department',
      payload: {
        departmentId: department.id,
        name: department.name,
        template: department.template,
        leaderId: department.leaderId,
      },
    });

    return department;
  }

  private async assertLeaderEligible(churchId: string, leaderId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: leaderId, churchId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Líder não encontrado nesta igreja.');
    }

    const roleAssignment = await this.prisma.churchRoleAssignment.findFirst({
      where: { churchId, userId: leaderId, role: { in: LEADER_ROLES } },
    });

    if (!roleAssignment) {
      throw new ForbiddenException('O líder designado deve ter papel de líder ou superior nesta igreja.');
    }
  }
}
