import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentFieldSeederService } from './services/department-field-seeder.service';
import { CreateDepartmentUseCase } from './use-cases/create-department.use-case';

@Module({
  imports: [DatabaseModule, AuthModule, AuditModule],
  controllers: [DepartmentsController],
  providers: [CreateDepartmentUseCase, DepartmentFieldSeederService],
  exports: [DepartmentFieldSeederService],
})
export class DepartmentsModule {}
