import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Enums
 */
export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  UNIVERSITY_ONLY = 'UNIVERSITY_ONLY',
  PRIVATE = 'PRIVATE',
}

export enum EducationStatus {
  CURRENT = 'CURRENT',
  GRADUATED = 'GRADUATED',
}

export enum DegreeLevel {
  BS = 'BS',
  MS = 'MS',
  PHD = 'PHD',
  DIPLOMA = 'DIPLOMA',
  OTHER = 'OTHER',
}

@Schema({ timestamps: true })
export class UserProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Basic info
  @Prop({ type: String, required: true, trim: true })
  fullName: string;

  @Prop({ type: String, required: true, unique: true, trim: true, lowercase: true })
  username: string;

  // Education
  @Prop({ type: String, enum: EducationStatus, default: EducationStatus.CURRENT })
  educationStatus: EducationStatus;

  @Prop({ type: String, enum: DegreeLevel, default: null })
  degreeLevel?: DegreeLevel;

  @Prop({ type: String, default: null, trim: true })
  degreeProgram?: string;

  @Prop({ type: Number, default: null, min: 1900, max: 2100 })
  startYear?: number;

  @Prop({ type: Number, default: null, min: 1900, max: 2100 })
  endYear?: number;

  @Prop({ type: Number, default: null, min: 1, max: 20 })
  semester?: number;

  @Prop({ type: String, default: null, trim: true })
  section?: string;

  @Prop({ type: String, unique: true, sparse: true, trim: true })
  studentId?: string;


  // University info
  @Prop({ type: String, default: null, trim: true })
  universityName?: string;

  @Prop({ type: String, default: null, trim: true })
  campus?: string;

  @Prop({ type: String, default: null, trim: true })
  department?: string;

  // Contact & social
  @Prop({ type: String, default: null, trim: true })
  phone?: string;

  @Prop({ type: String, default: null, trim: true })
  whatsappNumber?: string;

  @Prop({ type: String, default: null, trim: true })
  bio?: string;

  @Prop({ type: String, default: null })
  skills?: string;

  @Prop({ type: String, default: null })
  interests?: string;

  @Prop({ type: String, default: null })
  profileImageUrl?: string;

  @Prop({ type: String, default: null })
  linkedinUrl?: string;

  @Prop({ type: String, default: null })
  githubUrl?: string;

  @Prop({ type: String, default: null })
  instagramUrl?: string;

  @Prop({
    type: String,
    enum: ProfileVisibility,
    default: ProfileVisibility.PUBLIC,
  })
  profileVisibility: ProfileVisibility;

  @Prop({ type: Boolean, default: true })
  showEmailToSocietyAdmins: boolean;
}

export type UserProfileDocument = UserProfile & Document;
export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);

