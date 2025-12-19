import { IsEnum } from 'class-validator';
import { MemberRole } from '../enums/group.enums';

export class UpdateMemberRoleDto {
  @IsEnum(MemberRole)
  role: MemberRole;
}
