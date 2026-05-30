import { Injectable } from '@nestjs/common';
import { DepartmentTemplate } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

type FieldSeed = { label: string; order: number };

/**
 * Templates cujos campos fixos são gerenciados por tabelas próprias (songs, attendance,
 * service_timeline) e, portanto, não geram linhas em department_fields.
 * Templates sem campos fixos (midia, personalizado) também ficam fora do mapa.
 */
const TEMPLATE_FIELDS: Partial<Record<DepartmentTemplate, FieldSeed[]>> = {
  [DepartmentTemplate.danca]: [{ label: 'Figurino', order: 0 }],
};

type TxClient = Omit<
  PrismaService,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

@Injectable()
export class DepartmentFieldSeederService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria os department_fields automáticos para o template.
   * Deve ser chamado dentro da mesma transação que cria o Department.
   * Passa `tx` quando dentro de $transaction; omite para uso fora.
   */
  async seed(
    departmentId: string,
    churchId: string,
    template: DepartmentTemplate,
    tx?: TxClient,
  ): Promise<void> {
    const fields = TEMPLATE_FIELDS[template];
    if (!fields || fields.length === 0) return;

    const client = tx ?? this.prisma;

    await client.departmentField.createMany({
      data: fields.map((f) => ({
        departmentId,
        churchId,
        label: f.label,
        order: f.order,
      })),
    });
  }

  /** Retorna quais campos serão semeados para um dado template (útil para preview na UI). */
  getTemplateFields(template: DepartmentTemplate): FieldSeed[] {
    return TEMPLATE_FIELDS[template] ?? [];
  }
}
