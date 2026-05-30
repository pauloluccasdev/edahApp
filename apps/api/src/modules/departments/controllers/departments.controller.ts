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
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';
import { CreateDepartmentUseCase } from '../use-cases/create-department.use-case';
import { DeactivateDepartmentUseCase } from '../use-cases/deactivate-department.use-case';
import { DeleteDepartmentUseCase } from '../use-cases/delete-department.use-case';
import { GetDepartmentUseCase } from '../use-cases/get-department.use-case';
import { ListDepartmentSchedulesUseCase } from '../use-cases/list-department-schedules.use-case';
import { ListDepartmentsUseCase } from '../use-cases/list-departments.use-case';
import { UpdateDepartmentUseCase } from '../use-cases/update-department.use-case';

@Controller()
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(
    private readonly createDepartment: CreateDepartmentUseCase,
    private readonly listDepartments: ListDepartmentsUseCase,
    private readonly getDepartment: GetDepartmentUseCase,
    private readonly listDepartmentSchedules: ListDepartmentSchedulesUseCase,
    private readonly updateDepartment: UpdateDepartmentUseCase,
    private readonly deactivateDepartment: DeactivateDepartmentUseCase,
    private readonly deleteDepartment: DeleteDepartmentUseCase,
  ) {}

  @Post('churches/:churchId/departments')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.createDepartment.execute(churchId, dto, operator);
  }

  @Get('churches/:churchId/departments')
  list(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.listDepartments.execute(churchId, operator);
  }

  @Get('churches/:churchId/departments/:departmentId')
  findOne(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.getDepartment.execute(churchId, departmentId, operator);
  }

  @Get('churches/:churchId/departments/:departmentId/schedules')
  recentSchedules(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.listDepartmentSchedules.execute(churchId, departmentId, operator);
  }

  @Patch('churches/:churchId/departments/:departmentId')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.updateDepartment.execute(churchId, departmentId, dto, operator);
  }

  @Patch('churches/:churchId/departments/:departmentId/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.deactivateDepartment.execute(churchId, departmentId, operator);
  }

  @Delete('churches/:churchId/departments/:departmentId')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.deleteDepartment.execute(churchId, departmentId, operator);
  }
}
