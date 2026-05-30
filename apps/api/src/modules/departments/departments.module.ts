import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { DepartmentFieldSeederService } from './services/department-field-seeder.service';

@Module({
  imports: [DatabaseModule],
  providers: [DepartmentFieldSeederService],
  exports: [DepartmentFieldSeederService],
})
export class DepartmentsModule {}
