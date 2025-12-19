import { IsArray, IsEmail, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GroupType, JoinPolicy } from '../enums/group.enums';

class SocialLinkDto {
  @IsString()
  @MaxLength(30)
  label: string;

  @IsString()
  @MaxLength(300)
  url: string;
}

export class CreateGroupDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsEnum(GroupType)
  type: GroupType;

  @IsString()
  @MaxLength(40)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  department?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsEnum(JoinPolicy)
  joinPolicy?: JoinPolicy;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];
}
