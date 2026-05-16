import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    Matches,
    MaxLength,
    MinLength,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

import { Transform } from 'class-transformer';
import { EventMode, EventType } from '../enums/event.enums';

@ValidatorConstraint({ name: 'isAfterStartDate', async: false })
class IsAfterStartDate implements ValidatorConstraintInterface {
    validate(endDateTime: string, args: ValidationArguments): boolean {
        const dto = args.object as CreateEventDto;

        if (!dto.startDateTime || !endDateTime) {
            return true;
        }

        return new Date(endDateTime) > new Date(dto.startDateTime);
    }

    defaultMessage(): string {
        return 'endDateTime must be after startDateTime';
    }
}

@ValidatorConstraint({ name: 'registrationLinkRequired', async: false })
class RegistrationLinkRequired
    implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments): boolean {
        const dto = args.object as CreateEventDto;

        if (dto.isRegistrationRequired) {
            return !!dto.registrationLink;
        }

        return true;
    }

    defaultMessage(): string {
        return 'registrationLink is required when registration is enabled';
    }
}

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(150)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(20)
    @MaxLength(5000)
    description!: string;

    @IsEnum(EventType)
    @IsNotEmpty()
    eventType!: EventType;

    @IsEnum(EventMode)
    @IsNotEmpty()
    mode!: EventMode;

    @IsDateString()
    @IsNotEmpty()
    startDateTime!: string;

    @IsDateString()
    @IsNotEmpty()
    @Validate(IsAfterStartDate)
    endDateTime!: string;

    @IsString()
    @IsOptional()
    @MaxLength(300)
    @Transform(({ value }) => value?.trim() ?? null)
    venue?: string;

    @IsUrl()
    @IsOptional()
    @Transform(({ value }) => value?.trim() ?? null)
    bannerUrl?: string;

    @IsUrl()
    @IsOptional()
    @Transform(({ value }) => value?.trim() ?? null)
    registrationLink?: string;

    @IsOptional()
    @IsString()
    @MaxLength(30)
    whatsappNumber?: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    instagramHandle?: string;

    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;

        return false;
    })
    isRegistrationRequired!: boolean;

    @Validate(RegistrationLinkRequired)
    registrationValidation!: boolean;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
        }

        return value ?? [];
    })
    tags?: string[];
}