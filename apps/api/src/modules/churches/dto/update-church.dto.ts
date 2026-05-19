import { IsInt, IsOptional, IsString, Matches, Min, MinLength } from 'class-validator';

export class UpdateChurchDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hifens',
  })
  slug?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  auxiliarLimit?: number;
}
