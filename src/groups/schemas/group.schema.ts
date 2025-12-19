import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { GroupStatus, GroupType, JoinPolicy } from '../enums/group.enums';

export type GroupDocument = HydratedDocument<Group>;

@Schema({ timestamps: true })
export class Group {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: GroupType })
  type: GroupType;

  @Prop({ required: true, trim: true })
  category: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, default: '' })
  logoUrl: string;

  @Prop({ type: String, default: '' })
  department: string;

  @Prop({ type: String, default: '' })
  contactEmail: string;

  @Prop({
    type: [
      {
        label: { type: String, default: '' },
        url: { type: String, default: '' },
      },
    ],
    default: [],
  })
  socialLinks: Array<{ label: string; url: string }>;

  @Prop({ required: true, enum: JoinPolicy, default: JoinPolicy.APPROVAL_REQUIRED })
  joinPolicy: JoinPolicy;

  @Prop({ required: true, enum: GroupStatus, default: GroupStatus.PENDING })
  status: GroupStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  approvedAt: Date | null;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;
}

export const GroupSchema = SchemaFactory.createForClass(Group);

GroupSchema.index({ name: 1, isDeleted: 1 }, { unique: true });
GroupSchema.index({ type: 1, status: 1 });
