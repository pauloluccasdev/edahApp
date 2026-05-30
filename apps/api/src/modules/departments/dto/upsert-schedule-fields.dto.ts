import { IsArray, IsString, IsUUID, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleFieldValueDto {
  @IsUUID()
  departmentFieldId: string;

  @IsString()
  @MinLength(1)
  value: string;
}

export class UpsertScheduleFieldsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleFieldValueDto)
  fields: ScheduleFieldValueDto[];
}
