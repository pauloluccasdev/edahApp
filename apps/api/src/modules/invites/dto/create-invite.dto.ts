import { ChurchRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';

const INVITE_ROLES = [ChurchRole.lider, ChurchRole.membro] as const;
type InviteRole = (typeof INVITE_ROLES)[number];

export class CreateInviteDto {
  @IsEmail()
  email: string;

  @IsEnum(INVITE_ROLES, { message: 'role deve ser "lider" ou "membro"' })
  role: InviteRole;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}
