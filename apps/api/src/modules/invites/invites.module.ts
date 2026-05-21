import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { InvitesController } from './controllers/invites.controller';
import { AcceptInviteUseCase } from './use-cases/accept-invite.use-case';
import { CreateInviteUseCase } from './use-cases/create-invite.use-case';
import { ListMembersUseCase } from './use-cases/list-members.use-case';
import { ListMyChurchesUseCase } from './use-cases/list-my-churches.use-case';
import { ListPendingInvitesUseCase } from './use-cases/list-pending-invites.use-case';
import { ResendInviteUseCase } from './use-cases/resend-invite.use-case';
import { ValidateInviteUseCase } from './use-cases/validate-invite.use-case';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [InvitesController],
  providers: [
    CreateInviteUseCase,
    AcceptInviteUseCase,
    ValidateInviteUseCase,
    ResendInviteUseCase,
    ListMembersUseCase,
    ListPendingInvitesUseCase,
    ListMyChurchesUseCase,
  ],
})
export class InvitesModule {}
