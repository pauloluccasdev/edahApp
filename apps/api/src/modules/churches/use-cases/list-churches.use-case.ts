import { Injectable } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { ListChurchesQueryDto } from '../dto/list-churches-query.dto';

@Injectable()
export class ListChurchesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListChurchesQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = query.name
      ? { name: { contains: query.name, mode: 'insensitive' as const } }
      : {};

    const [churches, total] = await Promise.all([
      this.prisma.church.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          churchRoles: {
            where: { role: ChurchRole.pastor_central },
            select: { user: { select: { id: true, name: true, email: true } } },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.church.count({ where }),
    ]);

    const data = churches.map(({ churchRoles, ...church }) => ({
      ...church,
      pastor: churchRoles[0]?.user ?? null,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
