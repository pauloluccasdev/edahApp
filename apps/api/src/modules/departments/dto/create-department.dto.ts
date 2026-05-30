import { DepartmentTemplate } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class DepartmentFieldDto {
  @IsString()
  @MinLength(1)
  label: string;

  @IsInt()
  @Min(0)
  order: number;
}

export class CreateDepartmentDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  leaderId?: string;

  @IsEnum(DepartmentTemplate)
  template: DepartmentTemplate;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentFieldDto)
  fields?: DepartmentFieldDto[];
}
