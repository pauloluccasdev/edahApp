import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SelectChurchesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  execute() {
    return this.prisma.church.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
  }
}
