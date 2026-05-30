import { IsArray, IsOptional, IsString, IsUUID, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

import { DepartmentFieldDto } from './create-department.dto';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Aceita UUID válido ou null explícito (null só permitido para cronograma_culto — validado no use-case)
  @IsOptional()
  @ValidateIf((o: UpdateDepartmentDto) => o.leaderId !== null)
  @IsUUID()
  leaderId?: string | null;

  // Se fornecido, substitui todos os campos customizáveis (template-seeded são re-aplicados)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DepartmentFieldDto)
  fields?: DepartmentFieldDto[];
}
