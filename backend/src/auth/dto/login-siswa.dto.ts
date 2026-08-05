import { IsNotEmpty, IsString } from 'class-validator';

export class LoginSiswaDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
