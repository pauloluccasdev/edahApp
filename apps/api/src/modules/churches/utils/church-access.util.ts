import { ForbiddenException } from '@nestjs/common';
import { ChurchRole } from '@prisma/client';

import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

export function assertChurchAccess(user: AuthenticatedUser, churchId: string): void {
  if (user.isSuporte) return;
  if (
    (user.role === ChurchRole.pastor_central || user.role === ChurchRole.pastor_auxiliar) &&
    user.churchId === churchId
  ) return;
  throw new ForbiddenException('Sem permissão para acessar esta igreja.');
}
