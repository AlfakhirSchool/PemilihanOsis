import { IsNotEmpty, IsString } from 'class-validator';

export class LoginSiswaDto {
  @IsString()
  @IsNotEmpty()
  nis: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
