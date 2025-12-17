import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  STUDENT = 'STUDENT',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: String, required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({ type: Boolean, default: false })
  emailVerified: boolean;

  @Prop({ type: String, default: null })
  verificationCode?: string;

  @Prop({ type: Date, default: null })
  verificationExpiresAt?: Date;

  @Prop({ type: String, default: null })
  passwordResetCode?: string;

  @Prop({ type: Date, default: null })
  passwordResetExpiresAt?: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'UserProfile', default: null })
  profile?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  profileCompleted: boolean;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
