import { SetMetadata } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: ChurchRole[]) => SetMetadata(ROLES_KEY, roles);
