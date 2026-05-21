import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class ListMyChurchesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(operator: AuthenticatedUser) {
    const assignments = await this.prisma.churchRoleAssignment.findMany({
      where: { userId: operator.id },
      include: {
        church: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Deduplica por church_id, priorizando o role de maior hierarquia
    const roleOrder: Record<string, number> = {
      pastor_central: 0,
      pastor_auxiliar: 1,
      lider: 2,
      membro: 3,
    };

    const byChurch = new Map<string, (typeof assignments)[number]>();
    for (const assignment of assignments) {
      const existing = byChurch.get(assignment.churchId);
      if (!existing || roleOrder[assignment.role] < roleOrder[existing.role]) {
        byChurch.set(assignment.churchId, assignment);
      }
    }

    return Array.from(byChurch.values()).map(({ church, role }) => ({
      churchId: church.id,
      name: church.name,
      slug: church.slug,
      logoUrl: church.logoUrl,
      role,
    }));
  }
}
