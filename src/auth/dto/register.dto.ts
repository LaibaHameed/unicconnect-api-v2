import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  // you used name before; we keep it so frontend doesn't break
  @IsString()
  name: string;
}
