import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UpdateChurchDto } from '../dto/update-church.dto';
import { assertChurchAccess } from '../utils/church-access.util';

@Injectable()
export class UpdateChurchUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(churchId: string, dto: UpdateChurchDto, operator: AuthenticatedUser) {
    assertChurchAccess(operator, churchId);

    const church = await this.prisma.church.findUnique({ where: { id: churchId } });
    if (!church) throw new NotFoundException('Igreja não encontrada.');

    if (dto.slug && dto.slug !== church.slug) {
      const conflict = await this.prisma.church.findUnique({ where: { slug: dto.slug } });
      if (conflict) throw new ConflictException(`O slug "${dto.slug}" já está em uso.`);
    }

    const updated = await this.prisma.church.update({
      where: { id: churchId },
      data: {
        name: dto.name,
        slug: dto.slug,
        logoUrl: dto.logoUrl,
        timezone: dto.timezone,
        ...(operator.isSuporte && dto.auxiliarLimit !== undefined
          ? { auxiliarLimit: dto.auxiliarLimit }
          : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        timezone: true,
        auxiliarLimit: true,
        updatedAt: true,
      },
    });

    if (operator.isSuporte) {
      await this.auditLog.log({
        operatorId: operator.id,
        churchId,
        action: 'update_church',
        payload: { changes: dto as Record<string, unknown> },
      });
    }

    return updated;
  }
}
