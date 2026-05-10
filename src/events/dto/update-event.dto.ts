import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { EventStatus } from '../enums/event.enums';
import { CreateEventDto } from './create-event.dto';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  /**
   * Status is intentionally excluded from CreateEventDto and handled here
   * separately so that it can be validated as its own operation. Only
   * DRAFT → PUBLISHED and PUBLISHED → DRAFT transitions are allowed via
   * update; CANCELLED and COMPLETED have dedicated endpoints.
   */
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}