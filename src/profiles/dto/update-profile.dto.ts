import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsUrl,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { DegreeLevel, EducationStatus, ProfileVisibility } from '../schemas/user-profile.schema';

export class UpdateProfileDto {
  // ---------- Basic ----------
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  // ---------- Education ----------
  @IsOptional()
  @IsEnum(EducationStatus)
  educationStatus?: EducationStatus;

  @IsOptional()
  @IsEnum(DegreeLevel)
  degreeLevel?: DegreeLevel;

  @IsOptional()
  @IsString()
  degreeProgram?: string;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  startYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1900)
  @Max(2100)
  endYear?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  semester?: number;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  // ---------- University ----------
  @IsOptional()
  @IsString()
  universityName?: string;

  @IsOptional()
  @IsString()
  campus?: string;

  @IsOptional()
  @IsString()
  department?: string;

  // ---------- Contact ----------
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  // ---------- Bio & Skills ----------
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  skills?: string; // comma-separated

  @IsOptional()
  @IsString()
  interests?: string; // comma-separated

  // ---------- Socials ----------
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @IsOptional()
  @IsUrl()
  linkedinUrl?: string;

  @IsOptional()
  @IsUrl()
  githubUrl?: string;

  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  // ---------- Privacy ----------
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profileVisibility?: ProfileVisibility;

  @IsOptional()
  showEmailToSocietyAdmins?: boolean;
}
