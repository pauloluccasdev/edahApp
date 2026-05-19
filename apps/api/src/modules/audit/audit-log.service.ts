import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

const SENSITIVE_KEYS = new Set(['password', 'senha', 'token', 'secret', 'key', 'authorization']);

export interface AuditLogEntry {
  operatorId: string;
  churchId?: string;
  action: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          operatorId: entry.operatorId,
          churchId: entry.churchId,
          action: entry.action,
          payload: this.sanitize(entry.payload),
        },
      });
    } catch (err: unknown) {
      // Audit log failure never blocks the main operation
      this.logger.error(
        `Falha ao registrar audit log [action=${entry.action}, operator=${entry.operatorId}]: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private sanitize(value: unknown, key?: string): Prisma.InputJsonValue {
    if (key && SENSITIVE_KEYS.has(key.toLowerCase())) return '[REDACTED]';
    if (Array.isArray(value)) return value.map((item) => this.sanitize(item)) as Prisma.InputJsonValue;
    if (value !== null && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, this.sanitize(v, k)]),
      ) as Prisma.InputJsonValue;
    }
    return value as Prisma.InputJsonValue;
  }
}
