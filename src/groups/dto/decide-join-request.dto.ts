import { IsEnum } from 'class-validator';
import { JoinRequestStatus } from '../enums/group.enums';

export class DecideJoinRequestDto {
  @IsEnum([JoinRequestStatus.APPROVED, JoinRequestStatus.REJECTED])
  decision: JoinRequestStatus.APPROVED | JoinRequestStatus.REJECTED;
}
