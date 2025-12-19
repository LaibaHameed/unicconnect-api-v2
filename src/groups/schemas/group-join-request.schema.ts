import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { JoinRequestStatus } from '../enums/group.enums';

export type GroupJoinRequestDocument = HydratedDocument<GroupJoinRequest>;

@Schema({ timestamps: true })
export class GroupJoinRequest {
  @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
  groupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: JoinRequestStatus, required: true, default: JoinRequestStatus.PENDING })
  status: JoinRequestStatus;

  @Prop({ type: String, default: '' })
  note: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  actionBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  actionAt: Date | null;
}

export const GroupJoinRequestSchema = SchemaFactory.createForClass(GroupJoinRequest);

GroupJoinRequestSchema.index({ groupId: 1, userId: 1, status: 1 });
