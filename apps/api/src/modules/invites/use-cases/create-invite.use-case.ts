import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateInviteDto } from '../dto/create-invite.dto';

const INVITE_TTL_HOURS = 72;

@Injectable()
export class CreateInviteUseCase {
  private readonly logger = new Logger(CreateInviteUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(churchId: string, dto: CreateInviteDto, operator: AuthenticatedUser) {
    await this.assertPermission(churchId, dto, operator);

    // Verifica vínculo ativo na mesma igreja
    const existingMember = await this.prisma.user.findFirst({
      where: { email: dto.email, churchId },
    });
    if (existingMember) {
      throw new ConflictException('Este e-mail já possui um vínculo ativo nesta igreja.');
    }

    // Verifica convite pendente não utilizado
    const pendingInvite = await this.prisma.inviteToken.findFirst({
      where: {
        email: dto.email,
        churchId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (pendingInvite) {
      throw new ConflictException('Já existe um convite pendente para este e-mail nesta igreja.');
    }

    if (dto.role === ChurchRole.lider && !dto.departmentId) {
      throw new BadRequestException('departmentId é obrigatório para o papel de líder.');
    }

    if (dto.departmentId) {
      await this.assertDepartmentExists(churchId, dto.departmentId);
    }

    // Verifica se usuário já existe em qualquer igreja
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      return this.addExistingUser(churchId, dto, existingUser, operator);
    }

    return this.inviteNewUser(churchId, dto, operator);
  }

  private async addExistingUser(
    churchId: string,
    dto: CreateInviteDto,
    existingUser: { id: string; name: string; email: string | null },
    operator: AuthenticatedUser,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.churchRoleAssignment.create({
        data: { churchId, userId: existingUser.id, role: dto.role },
      });

      if (dto.departmentId) {
        await tx.departmentMember.create({
          data: { churchId, departmentId: dto.departmentId, userId: existingUser.id },
        });
      }
    });

    await this.auditLog.log({
      operatorId: operator.id,
      churchId,
      action: 'add_existing_member',
      payload: { userId: existingUser.id, email: existingUser.email, role: dto.role, departmentId: dto.departmentId },
    });

    // TODO Card de notificações: disparar notificação in-app / WhatsApp para existingUser

    return { type: 'added' as const, userId: existingUser.id, name: existingUser.name };
  }

  private async inviteNewUser(churchId: string, dto: CreateInviteDto, operator: AuthenticatedUser) {
    const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

    const invite = await this.prisma.inviteToken.create({
      data: {
        churchId,
        departmentId: dto.departmentId ?? null,
        invitedBy: operator.id,
        email: dto.email,
        role: dto.role,
        expiresAt,
      },
      select: { id: true, token: true },
    });

    void this.dispatchInviteEmail(dto.email, invite.token);

    await this.auditLog.log({
      operatorId: operator.id,
      churchId,
      action: 'invite_new_member',
      payload: { email: dto.email, role: dto.role, departmentId: dto.departmentId, inviteId: invite.id },
    });

    return { type: 'invited' as const, inviteId: invite.id };
  }

  private async assertPermission(churchId: string, dto: CreateInviteDto, operator: AuthenticatedUser) {
    const isPastor =
      operator.role === ChurchRole.pastor_central || operator.role === ChurchRole.pastor_auxiliar;

    if (operator.isSuporte || (isPastor && operator.churchId === churchId)) return;

    if (operator.role === ChurchRole.lider && operator.churchId === churchId) {
      // Líder só pode convidar membros
      if (dto.role !== ChurchRole.membro) {
        throw new ForbiddenException('Líderes só podem convidar membros.');
      }
      // Líder só pode convidar para seus próprios ministérios
      if (!dto.departmentId) return;
      const isLeader = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, churchId, leaderId: operator.id },
      });
      if (!isLeader) {
        throw new ForbiddenException('Você só pode convidar membros para ministérios que lidera.');
      }
      return;
    }

    throw new ForbiddenException('Sem permissão para convidar membros nesta igreja.');
  }

  private async assertDepartmentExists(churchId: string, departmentId: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, churchId },
    });
    if (!dept) throw new NotFoundException('Ministério não encontrado nesta igreja.');
  }

  private async dispatchInviteEmail(email: string, token: string): Promise<void> {
    // TODO: enviar e-mail real com o link do convite
    this.logger.log(`[INVITE] ${email} → token=${token}`);
  }
}
