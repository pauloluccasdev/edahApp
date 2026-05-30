import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DepartmentsController } from './controllers/departments.controller';
import { ScheduleFieldsController } from './controllers/schedule-fields.controller';
import { DepartmentFieldSeederService } from './services/department-field-seeder.service';
import { CreateDepartmentUseCase } from './use-cases/create-department.use-case';
import { DeactivateDepartmentUseCase } from './use-cases/deactivate-department.use-case';
import { DeleteDepartmentUseCase } from './use-cases/delete-department.use-case';
import { GetScheduleFieldsUseCase } from './use-cases/get-schedule-fields.use-case';
import { GetScheduleUseCase } from './use-cases/get-schedule.use-case';
import { UpsertScheduleFieldsUseCase } from './use-cases/upsert-schedule-fields.use-case';
import { GetDepartmentUseCase } from './use-cases/get-department.use-case';
import { ListDepartmentSchedulesUseCase } from './use-cases/list-department-schedules.use-case';
import { ListDepartmentsUseCase } from './use-cases/list-departments.use-case';
import { UpdateDepartmentUseCase } from './use-cases/update-department.use-case';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [DepartmentsController, ScheduleFieldsController],
  providers: [
    DepartmentFieldSeederService,
    CreateDepartmentUseCase,
    ListDepartmentsUseCase,
    GetDepartmentUseCase,
    ListDepartmentSchedulesUseCase,
    UpdateDepartmentUseCase,
    DeactivateDepartmentUseCase,
    DeleteDepartmentUseCase,
    UpsertScheduleFieldsUseCase,
    GetScheduleFieldsUseCase,
    GetScheduleUseCase,
  ],
  exports: [DepartmentFieldSeederService],
})
export class DepartmentsModule {}
