import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { TransferChurchDto } from '../dto/transfer-church.dto';

@Injectable()
export class TransferChurchUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(churchId: string, dto: TransferChurchDto, operator: AuthenticatedUser): Promise<void> {
    // Only the pastor_central of this specific church may transfer ownership.
    // Suporte is intentionally excluded — this is a self-service act of delegation.
    if (
      operator.isSuporte ||
      operator.role !== ChurchRole.pastor_central ||
      operator.churchId !== churchId
    ) {
      throw new ForbiddenException('Apenas o Pastor Central da própria igreja pode transferir a posse.');
    }

    if (dto.targetUserId === operator.id) {
      throw new BadRequestException('O destino da transferência deve ser um usuário diferente do atual Pastor Central.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
      select: { id: true, name: true, churchId: true },
    });

    if (!targetUser || targetUser.churchId !== churchId) {
      throw new NotFoundException('Usuário não encontrado nesta igreja.');
    }

    const currentAssignment = await this.prisma.churchRoleAssignment.findFirst({
      where: { churchId, userId: operator.id, role: ChurchRole.pastor_central },
      select: { id: true },
    });
    if (!currentAssignment) {
      throw new NotFoundException('Atribuição de Pastor Central não encontrada.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove auxiliar role if target already has one (can't hold two roles simultaneously)
      await tx.churchRoleAssignment.deleteMany({
        where: { churchId, userId: dto.targetUserId, role: ChurchRole.pastor_auxiliar },
      });

      // Remove current pastor_central assignment
      await tx.churchRoleAssignment.delete({ where: { id: currentAssignment.id } });

      // Assign pastor_central to target
      await tx.churchRoleAssignment.create({
        data: { churchId, userId: dto.targetUserId, role: ChurchRole.pastor_central },
      });
    });

    await this.auditLog.log({
      operatorId: operator.id,
      churchId,
      action: 'transfer_church_ownership',
      payload: {
        from: { userId: operator.id },
        to: { userId: dto.targetUserId, name: targetUser.name },
      },
    });
  }
}
