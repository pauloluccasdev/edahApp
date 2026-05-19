import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PastorDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;
}

export class CreateChurchDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => PastorDto)
  pastor: PastorDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PastorDto)
  auxiliar?: PastorDto;
}
