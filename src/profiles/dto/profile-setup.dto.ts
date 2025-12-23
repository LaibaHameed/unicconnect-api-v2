import {
    IsOptional,
    IsString,
    MinLength,
    IsEnum,
    IsInt,
    Min,
    Max,
} from 'class-validator';
import { DegreeLevel } from '../schemas/user-profile.schema'; // adjust path if needed

export class ProfileSetupDto {
    @IsString()
    @MinLength(2)
    fullName: string;

    @IsString()
    @MinLength(3)
    username: string;

    @IsOptional()
    @IsString()
    universityName?: string;

    @IsOptional()
    @IsString()
    department?: string;

    @IsOptional()
    @IsString()
    degreeProgram?: string;

    // ✅ ADDED
    @IsOptional()
    @IsEnum(DegreeLevel)
    degreeLevel?: DegreeLevel;

    // ✅ ADDED
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(20)
    semester?: number;
}
