import { IsEmail, IsString, MinLength } from 'class-validator';

export class AddPastorAuxiliarDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;
}
