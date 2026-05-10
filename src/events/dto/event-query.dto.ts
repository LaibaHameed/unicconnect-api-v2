import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsMongoId,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { EventMode, EventStatus, EventType } from '../enums/event.enums';

export class EventQueryDto {
    // ── Filters ────────────────────────────────────────────────────────────────

    @IsMongoId()
    @IsOptional()
    groupId?: string;

    @IsEnum(EventStatus)
    @IsOptional()
    status?: EventStatus;

    @IsEnum(EventType)
    @IsOptional()
    eventType?: EventType;

    @IsEnum(EventMode)
    @IsOptional()
    mode?: EventMode;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    @Transform(({ value }) => value?.trim() || undefined)
    search?: string;

    /**
     * When true, returns only events where startDateTime >= now
     * and status = PUBLISHED. Overrides any provided `status` filter.
     */
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return undefined;
    })
    upcoming?: boolean;

    // ── Pagination ─────────────────────────────────────────────────────────────

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number = 20;
}