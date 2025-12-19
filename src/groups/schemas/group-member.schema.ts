import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MemberRole } from '../enums/group.enums';

export type GroupMemberDocument = HydratedDocument<GroupMember>;

@Schema({ timestamps: true })
export class GroupMember {
  @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
  groupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: MemberRole, required: true, default: MemberRole.MEMBER })
  role: MemberRole;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  removedAt: Date | null;
}

export const GroupMemberSchema = SchemaFactory.createForClass(GroupMember);

GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
GroupMemberSchema.index({ groupId: 1, role: 1, isActive: 1 });
