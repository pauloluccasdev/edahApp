import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class SuporteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();

    if (!user?.isSuporte) {
      throw new ForbiddenException('Acesso restrito ao perfil Suporte.');
    }

    return true;
  }
}
