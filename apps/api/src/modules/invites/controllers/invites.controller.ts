import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { CreateInviteDto } from '../dto/create-invite.dto';
import { AcceptInviteUseCase } from '../use-cases/accept-invite.use-case';
import { CreateInviteUseCase } from '../use-cases/create-invite.use-case';
import { ListMembersUseCase } from '../use-cases/list-members.use-case';
import { ListMyChurchesUseCase } from '../use-cases/list-my-churches.use-case';
import { ListPendingInvitesUseCase } from '../use-cases/list-pending-invites.use-case';
import { ResendInviteUseCase } from '../use-cases/resend-invite.use-case';
import { ValidateInviteUseCase } from '../use-cases/validate-invite.use-case';

@Controller()
export class InvitesController {
  constructor(
    private readonly createInvite: CreateInviteUseCase,
    private readonly acceptInvite: AcceptInviteUseCase,
    private readonly validateInvite: ValidateInviteUseCase,
    private readonly resendInvite: ResendInviteUseCase,
    private readonly listMembers: ListMembersUseCase,
    private readonly listPendingInvites: ListPendingInvitesUseCase,
    private readonly listMyChurches: ListMyChurchesUseCase,
  ) {}

  // BE-03.6 — igrejas do usuário autenticado
  @Get('me/churches')
  @UseGuards(JwtAuthGuard)
  myChurches(@CurrentUser() operator: AuthenticatedUser) {
    return this.listMyChurches.execute(operator);
  }

  // BE-03.2 — criar convite
  @Post('churches/:churchId/invites')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Body() dto: CreateInviteDto,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.createInvite.execute(churchId, dto, operator);
  }

  // BE-03.4 — reenviar convite
  @Post('churches/:churchId/invites/:inviteId/resend')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  resend(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('inviteId', ParseUUIDPipe) inviteId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.resendInvite.execute(churchId, inviteId, operator);
  }

  // BE-03.5 — listar membros ativos
  @Get('churches/:churchId/members')
  @UseGuards(JwtAuthGuard)
  members(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.listMembers.execute(churchId, operator);
  }

  // BE-03.5 — listar convites pendentes
  @Get('churches/:churchId/invites')
  @UseGuards(JwtAuthGuard)
  pendingInvites(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.listPendingInvites.execute(churchId, operator);
  }

  // BE-03.3 — validar convite (rota pública — sem JwtAuthGuard)
  @Get('invites/:token')
  @HttpCode(HttpStatus.OK)
  validate(@Param('token') token: string) {
    return this.validateInvite.execute(token);
  }

  // BE-03.3 — aceitar convite (rota pública — sem JwtAuthGuard)
  @Post('invites/:token/accept')
  @HttpCode(HttpStatus.OK)
  accept(@Param('token') token: string, @Body() dto: AcceptInviteDto) {
    return this.acceptInvite.execute(token, dto);
  }
}
