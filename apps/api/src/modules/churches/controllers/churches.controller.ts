import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuporteGuard } from '../../auth/guards/suporte.guard';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { AddPastorAuxiliarDto } from '../dto/add-pastor-auxiliar.dto';
import { CreateChurchDto } from '../dto/create-church.dto';
import { ListChurchesQueryDto } from '../dto/list-churches-query.dto';
import { TransferChurchDto } from '../dto/transfer-church.dto';
import { UpdateChurchDto } from '../dto/update-church.dto';
import { AddPastorAuxiliarUseCase } from '../use-cases/add-pastor-auxiliar.use-case';
import { CreateChurchUseCase } from '../use-cases/create-church.use-case';
import { GetChurchUseCase } from '../use-cases/get-church.use-case';
import { ListChurchesUseCase } from '../use-cases/list-churches.use-case';
import { RemovePastorAuxiliarUseCase } from '../use-cases/remove-pastor-auxiliar.use-case';
import { SelectChurchesUseCase } from '../use-cases/select-churches.use-case';
import { TransferChurchUseCase } from '../use-cases/transfer-church.use-case';
import { UpdateChurchUseCase } from '../use-cases/update-church.use-case';

@Controller('admin/churches')
@UseGuards(JwtAuthGuard)
export class ChurchesController {
  constructor(
    private readonly createChurch: CreateChurchUseCase,
    private readonly listChurches: ListChurchesUseCase,
    private readonly selectChurches: SelectChurchesUseCase,
    private readonly getChurch: GetChurchUseCase,
    private readonly updateChurch: UpdateChurchUseCase,
    private readonly addPastorAuxiliar: AddPastorAuxiliarUseCase,
    private readonly removePastorAuxiliar: RemovePastorAuxiliarUseCase,
    private readonly transferChurch: TransferChurchUseCase,
  ) {}

  @Get()
  @UseGuards(SuporteGuard)
  findAll(@Query() query: ListChurchesQueryDto) {
    return this.listChurches.execute(query);
  }

  @Get('select')
  @UseGuards(SuporteGuard)
  select() {
    return this.selectChurches.execute();
  }

  @Get(':churchId')
  findOne(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.getChurch.execute(churchId, operator);
  }

  @Post()
  @UseGuards(SuporteGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateChurchDto, @CurrentUser() operator: AuthenticatedUser) {
    return this.createChurch.execute(dto, operator);
  }

  @Patch(':churchId')
  update(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Body() dto: UpdateChurchDto,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.updateChurch.execute(churchId, dto, operator);
  }

  @Post(':churchId/pastors')
  @HttpCode(HttpStatus.CREATED)
  addPastor(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Body() dto: AddPastorAuxiliarDto,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.addPastorAuxiliar.execute(churchId, dto, operator);
  }

  @Delete(':churchId/pastors/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removePastor(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.removePastorAuxiliar.execute(churchId, userId, operator);
  }

  @Patch(':churchId/transfer')
  @HttpCode(HttpStatus.NO_CONTENT)
  transfer(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Body() dto: TransferChurchDto,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.transferChurch.execute(churchId, dto, operator);
  }
}
