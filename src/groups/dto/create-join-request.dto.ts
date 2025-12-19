import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJoinRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;
}
