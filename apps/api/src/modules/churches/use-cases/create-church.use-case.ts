import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ChurchRole, Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { SupabaseAuthService } from '../../auth/services/supabase-auth.service';
import { CreateChurchDto } from '../dto/create-church.dto';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

@Injectable()
export class CreateChurchUseCase {
  private readonly logger = new Logger(CreateChurchUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuth: SupabaseAuthService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(dto: CreateChurchDto, operator: AuthenticatedUser) {
    const slug = dto.slug?.trim() || generateSlug(dto.name);

    await this.assertSlugAvailable(slug);
    await this.assertEmailAvailable(dto.pastor.email, 'pastor central');
    if (dto.auxiliar) {
      await this.assertEmailAvailable(dto.auxiliar.email, 'pastor auxiliar');
    }

    const result = await this.createInTransaction(dto, slug);

    await this.auditLog.log({
      operatorId: operator.id,
      churchId: result.id,
      action: 'create_church',
      payload: {
        church: { id: result.id, name: result.name, slug: result.slug },
        pastor: { id: result.pastor.id, name: result.pastor.name, email: result.pastor.email },
        auxiliar: result.auxiliar
          ? { id: result.auxiliar.id, name: result.auxiliar.name, email: result.auxiliar.email }
          : null,
      },
    });

    // Fire-and-forget: envia convites e armazena supabase_id após o commit
    void this.dispatchInvites(
      { userId: result.pastor.id, email: dto.pastor.email },
      result.auxiliar && dto.auxiliar
        ? { userId: result.auxiliar.id, email: dto.auxiliar.email }
        : undefined,
    );

    return result;
  }

  private async createInTransaction(dto: CreateChurchDto, slug: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const church = await tx.church.create({
          data: { name: dto.name, slug },
          select: { id: true, name: true, slug: true, createdAt: true },
        });

        const pastor = await tx.user.create({
          data: {
            churchId: church.id,
            name: dto.pastor.name,
            email: dto.pastor.email,
          },
          select: { id: true, name: true, email: true },
        });

        await tx.churchRoleAssignment.create({
          data: { churchId: church.id, userId: pastor.id, role: ChurchRole.pastor_central },
        });

        let auxiliar: { id: string; name: string; email: string | null; role: ChurchRole } | null = null;

        if (dto.auxiliar) {
          const created = await tx.user.create({
            data: {
              churchId: church.id,
              name: dto.auxiliar.name,
              email: dto.auxiliar.email,
            },
            select: { id: true, name: true, email: true },
          });

          await tx.churchRoleAssignment.create({
            data: { churchId: church.id, userId: created.id, role: ChurchRole.pastor_auxiliar },
          });

          auxiliar = { ...created, role: ChurchRole.pastor_auxiliar };
        }

        return {
          ...church,
          pastor: { ...pastor, role: ChurchRole.pastor_central },
          auxiliar,
        };
      });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Slug ou e-mail já está em uso. Por favor, revise os dados informados.');
      }
      throw new InternalServerErrorException('Erro ao criar a igreja. Por favor, tente novamente.');
    }
  }

  private async dispatchInvites(
    pastor: { userId: string; email: string },
    auxiliar?: { userId: string; email: string },
  ): Promise<void> {
    const invites = [pastor];
    if (auxiliar) invites.push(auxiliar);

    await Promise.allSettled(invites.map(({ userId, email }) => this.dispatchSingleInvite(userId, email)));
  }

  private async dispatchSingleInvite(userId: string, email: string): Promise<void> {
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

  private async assertNoPastorCentral(churchId: string): Promise<void> {
    const existing = await this.prisma.churchRoleAssignment.findFirst({
      where: { churchId, role: ChurchRole.pastor_central },
    });
    if (existing) {
      throw new ConflictException('Esta igreja já possui um Pastor Central cadastrado.');
    }
  }

  private async assertSlugAvailable(slug: string): Promise<void> {
    const existing = await this.prisma.church.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictException(`O slug "${slug}" já está em uso. Escolha outro.`);
    }
  }

  private async assertEmailAvailable(email: string, label: string): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException(`O e-mail do ${label} já está cadastrado na plataforma.`);
    }
  }
}
