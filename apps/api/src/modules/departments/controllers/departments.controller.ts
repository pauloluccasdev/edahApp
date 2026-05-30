import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { CreateDepartmentUseCase } from '../use-cases/create-department.use-case';

@Controller()
@UseGuards(JwtAuthGuard)
export class DepartmentsController {
  constructor(private readonly createDepartment: CreateDepartmentUseCase) {}

  @Post('churches/:churchId/departments')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('churchId', ParseUUIDPipe) churchId: string,
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() operator: AuthenticatedUser,
  ) {
    return this.createDepartment.execute(churchId, dto, operator);
  }
}
