import { IsOptional, IsString, MinLength } from 'class-validator';

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
}
