import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UpsertScheduleFieldsDto } from '../dto/upsert-schedule-fields.dto';
import { GetScheduleFieldsUseCase } from '../use-cases/get-schedule-fields.use-case';
import { GetScheduleUseCase } from '../use-cases/get-schedule.use-case';
import { UpsertScheduleFieldsUseCase } from '../use-cases/upsert-schedule-fields.use-case';

@Controller()
@UseGuards(JwtAuthGuard)
export class ScheduleFieldsController {
  constructor(
    private readonly upsertFields: UpsertScheduleFieldsUseCase,
    private readonly getFields: GetScheduleFieldsUseCase,
    private readonly getSchedule: GetScheduleUseCase,
  ) {}

  @Get('churches/:churchId/schedules/:scheduleId')
  findOne(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.getSchedule.execute(churchId, scheduleId, operator);
  }

  @Put('churches/:churchId/schedules/:scheduleId/fields')
  @HttpCode(HttpStatus.OK)
  upsert(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @Body() dto: UpsertScheduleFieldsDto,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.upsertFields.execute(churchId, scheduleId, dto, operator);
  }

  @Get('churches/:churchId/schedules/:scheduleId/fields')
  findAll(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('scheduleId', ParseUUIDPipe) scheduleId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.getFields.execute(churchId, scheduleId, operator);
  }
}
