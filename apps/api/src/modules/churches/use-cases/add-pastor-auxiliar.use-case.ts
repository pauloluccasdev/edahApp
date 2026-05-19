import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { SupabaseAuthService } from '../../auth/services/supabase-auth.service';
import { AddPastorAuxiliarDto } from '../dto/add-pastor-auxiliar.dto';
import { assertChurchAccess } from '../utils/church-access.util';

@Injectable()
export class AddPastorAuxiliarUseCase {
  private readonly logger = new Logger(AddPastorAuxiliarUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(churchId: string, dto: AddPastorAuxiliarDto, operator: AuthenticatedUser) {
    assertChurchAccess(operator, churchId);

    const church = await this.prisma.church.findUnique({
      where: { id: churchId },
      select: { id: true, auxiliarLimit: true },
    });
    if (!church) throw new NotFoundException('Igreja não encontrada.');

    const currentCount = await this.prisma.churchRoleAssignment.count({
      where: { churchId, role: ChurchRole.pastor_auxiliar },
    });
    if (currentCount >= church.auxiliarLimit) {
      throw new ConflictException(
        `Limite de pastores auxiliares atingido (máx. ${church.auxiliarLimit}). Entre em contato com o Suporte para aumentar o limite.`,
      );
    }

    const emailInUse = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (emailInUse) {
      throw new ConflictException('O e-mail do pastor auxiliar já está cadastrado na plataforma.');
    }

    const user = await this.prisma.user.create({
      data: { churchId, name: dto.name, email: dto.email },
      select: { id: true, name: true, email: true },
    });

    await this.prisma.churchRoleAssignment.create({
      data: { churchId, userId: user.id, role: ChurchRole.pastor_auxiliar },
    });

    if (operator.isSuporte) {
      await this.auditLog.log({
        operatorId: operator.id,
        churchId,
        action: 'add_pastor_auxiliar',
        payload: { pastor: { id: user.id, name: user.name, email: user.email } },
      });
    }

    void this.dispatchInvite(user.id, dto.email);

    return { ...user, role: ChurchRole.pastor_auxiliar };
  }

  private async dispatchInvite(userId: string, email: string): Promise<void> {
    try {
      const { supabaseId, inviteLink } = await this.supabaseAuth.inviteUser(email);
      await this.prisma.user.update({ where: { id: userId }, data: { supabaseId } });
      this.logger.log(`[INVITE] ${email} → ${inviteLink}`);
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao enviar convite para ${email} (userId=${userId}): ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
