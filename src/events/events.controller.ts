import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('events')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  // ── Find all ───────────────────────────────────────────────────────────────
  // GET /events
  // Public — supports: ?upcoming, ?groupId, ?status, ?eventType, ?mode, ?search, ?page, ?limit

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: EventQueryDto) {
    return this.eventsService.findAll(query);
  }

  // ── Find one ───────────────────────────────────────────────────────────────
  // GET /events/:id
  // Public

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  // PATCH /events/:id

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.update(id, dto, user._id.toString());
  }

  // ── Cancel — must be before :id to avoid route conflict ───────────────────
  // PATCH /events/:id/cancel

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.cancel(id, user._id.toString());
  }

  // ── Soft delete ────────────────────────────────────────────────────────────
  // DELETE /events/:id

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.delete(id, user._id.toString());
  }

  // ── Regenerate AI summary ──────────────────────────────────────────────────
  // POST /events/:id/regenerate-summary

  @Post(':id/regenerate-summary')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  regenerateSummary(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.regenerateSummary(id, user._id.toString());
  }
}