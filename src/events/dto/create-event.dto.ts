import {
    IsArray,
    IsDateString,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
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