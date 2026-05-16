import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Event, EventDocument, EventSchema } from './schemas/event.schema';
import { EventStatus } from './enums/event.enums';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventQueryDto } from './dto/event-query.dto';
import { AiSummaryService } from '../ai-summary/ai-summary.service';
import { GroupAdminHelper } from '../common/helpers/group-admin.helper';

import {
    buildPaginationMeta,
    getSkip,
    PaginatedResult,
} from '../common/helpers/pagination.helper';
import { MailService } from 'src/mail/mail.service';
import { GroupMember, GroupMemberDocument } from 'src/groups/schemas/group-member.schema';

/** Transitions allowed via the general update endpoint. */
const ALLOWED_STATUS_TRANSITIONS: Partial<Record<EventStatus, EventStatus[]>> = {
    [EventStatus.DRAFT]: [EventStatus.PUBLISHED],
    [EventStatus.PUBLISHED]: [EventStatus.DRAFT],
};

/** Terminal statuses — no further edits permitted. */
const TERMINAL_STATUSES = new Set<EventStatus>([
    EventStatus.CANCELLED,
    EventStatus.COMPLETED,
]);

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);

    constructor(
        @InjectModel(Event.name)
        private readonly eventModel: Model<EventDocument>,

        @InjectModel(GroupMember.name)
        private readonly groupMemberModel: Model<GroupMemberDocument>,
        private readonly groupAdminHelper: GroupAdminHelper,
        private readonly aiSummaryService: AiSummaryService,
        private readonly mailService: MailService,
    ) { }

    // ── 1. Create ──────────────────────────────────────────────────────────────

    async create(
        dto: CreateEventDto,
        userId: string,
        groupId: string,
    ): Promise<EventDocument> {
        await this.groupAdminHelper.verifyGroupAdmin(userId, groupId);

        const event = await this.eventModel.create({
            ...dto,
            groupId: new Types.ObjectId(groupId),
            createdBy: new Types.ObjectId(userId),
            startDateTime: new Date(dto.startDateTime),
            endDateTime: new Date(dto.endDateTime),
            status: EventStatus.PUBLISHED,
        });

        // Fire-and-forget AI summary
        if (this.aiSummaryService.shouldSummarise(dto.description)) {
            this.triggerAiSummary(event._id.toString(), dto.description);
        }

        // ── EMAIL NOTIFICATION LOGIC ─────────────────────────────
        try {
            const populatedEvent = await this.eventModel
                .findById(event._id)
                .populate('groupId', 'name')
                .lean();

            if (populatedEvent) {
                // TODO:
                // Replace with actual group member emails
                const members = await this.groupMemberModel
                    .find({
                        groupId: populatedEvent.groupId,
                        status: 'APPROVED',
                    })
                    .populate('userId', 'email')
                    .lean();

                const memberEmails = members.map(
                    (member: any) => member.userId.email,
                );

                await this.mailService.sendNewEventEmail({
                    to: memberEmails,
                    societyName: (populatedEvent.groupId as any).name,
                    title: populatedEvent.title,
                    date: populatedEvent.startDateTime.toISOString(),
                    eventUrl: `${process.env.FRONTEND_URL}/events/${populatedEvent._id}`,
                    registrationLink: populatedEvent.registrationLink,
                });
            }
        } catch (error) {
            this.logger.error('Failed to send event creation emails', error);
        }

        return event;
    }

    // ── 2. Find all (paginated + filtered) ────────────────────────────────────

    async findAll(query: EventQueryDto): Promise<PaginatedResult<EventDocument>> {
        const { page = 1, limit = 20, search, upcoming, groupId, status, eventType, mode } = query;

        const filter: Record<string, any> = {
            isDeleted: false,
        };

        if (upcoming) {
            // upcoming overrides any user-provided status filter
            filter.startDateTime = { $gte: new Date() };
            filter.status = EventStatus.PUBLISHED;
        } else {
            if (status) filter.status = status;
        }

        if (groupId) filter.groupId = new Types.ObjectId(groupId);
        if (eventType) filter.eventType = eventType;
        if (mode) filter.mode = mode;

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } },
            ];
        }

        const [data, total] = await Promise.all([
            this.eventModel
                .find(filter)
                .populate('groupId', 'name')
                .sort({ startDateTime: 1 })
                .skip(getSkip(page, limit))
                .limit(limit)
                .lean()
                .exec(),
            this.eventModel.countDocuments(filter),
        ]);

        return {
            data: data as EventDocument[],
            meta: buildPaginationMeta(total, page, limit),
        };
    }

    // ── 3. Find one ────────────────────────────────────────────────────────────

    async findOne(id: string): Promise<EventDocument> {
        this.assertValidObjectId(id);

        const event = await this.eventModel
            .findOne({ _id: id, isDeleted: false })
            .populate('groupId', 'name')
            .lean()
            .exec();

        if (!event) throw new NotFoundException('Event not found.');

        return event as EventDocument;
    }

    // ── 4. Update ──────────────────────────────────────────────────────────────

    async update(
        id: string,
        dto: UpdateEventDto,
        userId: string,
    ): Promise<EventDocument> {
        const event = await this.findActiveEventOrThrow(id);

        await this.assertCanMutate(event, userId);
        this.assertNotTerminal(event);

        if (dto.status) {
            this.assertValidStatusTransition(event.status, dto.status);
        }

        // Re-generate AI summary if description changed and is long enough
        const descriptionChanged =
            dto.description && dto.description !== event.description;

        const updated = await this.eventModel
            .findByIdAndUpdate(
                id,
                {
                    ...dto,
                    ...(dto.startDateTime && { startDateTime: new Date(dto.startDateTime) }),
                    ...(dto.endDateTime && { endDateTime: new Date(dto.endDateTime) }),
                },
                { new: true, runValidators: true },
            )
            .lean()
            .exec();

        if (
            descriptionChanged &&
            this.aiSummaryService.shouldSummarise(dto.description!)
        ) {
            this.triggerAiSummary(id, dto.description!);
        }

        // ── EMAIL NOTIFICATION LOGIC ─────────────────────────────
        try {
            if (updated) {
                const populatedEvent = await this.eventModel
                    .findById(updated._id)
                    .populate('groupId', 'name')
                    .lean();

                // TODO:
                // Replace with actual group member emails
                const memberEmails: string[] = [];

                await this.mailService.sendUpdatedEventEmail({
                    to: memberEmails,
                    societyName: (populatedEvent?.groupId as any).name,
                    title: populatedEvent?.title || '',
                    date: populatedEvent?.startDateTime.toISOString() || '',
                    eventUrl: `${process.env.FRONTEND_URL}/events/${updated._id}`,
                    registrationLink: populatedEvent?.registrationLink,
                });
            }
        } catch (error) {
            this.logger.error('Failed to send event update emails', error);
        }

        return updated as EventDocument;
    }

    // ── 5. Cancel ──────────────────────────────────────────────────────────────

    async cancel(id: string, userId: string): Promise<EventDocument> {
        const event = await this.findActiveEventOrThrow(id);

        await this.assertCanMutate(event, userId);

        if (event.status === EventStatus.CANCELLED) {
            throw new BadRequestException('Event is already cancelled.');
        }

        if (event.status === EventStatus.COMPLETED) {
            throw new BadRequestException('A completed event cannot be cancelled.');
        }

        const updated = await this.eventModel
            .findByIdAndUpdate(
                id,
                { status: EventStatus.CANCELLED },
                { new: true },
            )
            .lean()
            .exec();

        return updated as EventDocument;
    }

    // ── 6. Soft delete ────────────────────────────────────────────────────────

    async delete(id: string, userId: string): Promise<void> {
        const event = await this.findActiveEventOrThrow(id);

        await this.assertCanMutate(event, userId);

        await this.eventModel.findByIdAndUpdate(id, {
            isDeleted: true,
            deletedAt: new Date(),
        });
    }

    // ── 7. Regenerate AI summary (public — called by controller endpoint) ──────

    async regenerateSummary(id: string, userId: string): Promise<EventDocument> {
        const event = await this.findActiveEventOrThrow(id);

        await this.assertCanMutate(event, userId);

        const summary = await this.aiSummaryService.summarise(event.description);

        const updated = await this.eventModel
            .findByIdAndUpdate(id, { aiSummary: summary }, { new: true })
            .lean()
            .exec();

        return updated as EventDocument;
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Fetches an event that exists and is not soft-deleted.
     */
    private async findActiveEventOrThrow(id: string): Promise<EventDocument> {
        this.assertValidObjectId(id);

        const event = await this.eventModel
            .findOne({ _id: id, isDeleted: false })
            .exec();

        if (!event) throw new NotFoundException('Event not found.');

        return event;
    }

    /**
     * Asserts the requesting user is either the event creator
     * OR an active admin of the event's group.
     */
    private async assertCanMutate(
        event: EventDocument,
        userId: string,
    ): Promise<void> {
        const isCreator = event.createdBy.toString() === userId;
        if (isCreator) return;

        const isAdmin = await this.groupAdminHelper.isGroupAdmin(
            userId,
            event.groupId.toString(),
        );

        if (!isAdmin) {
            throw new ForbiddenException(
                'Only the event creator or a group admin can perform this action.',
            );
        }
    }

    /**
     * Guards against editing CANCELLED or COMPLETED events.
     */
    private assertNotTerminal(event: EventDocument): void {
        if (TERMINAL_STATUSES.has(event.status)) {
            throw new BadRequestException(
                `Cannot modify an event with status "${event.status}".`,
            );
        }
    }

    /**
     * Enforces allowed status transitions via the update endpoint.
     */
    private assertValidStatusTransition(
        current: EventStatus,
        next: EventStatus,
    ): void {
        const allowed = ALLOWED_STATUS_TRANSITIONS[current] ?? [];

        if (!allowed.includes(next)) {
            throw new BadRequestException(
                `Cannot transition event status from "${current}" to "${next}".`,
            );
        }
    }

    /**
     * Throws if the string is not a valid MongoDB ObjectId.
     * Prevents Mongoose from throwing a cryptic CastError downstream.
     */
    private assertValidObjectId(id: string): void {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(`"${id}" is not a valid event ID.`);
        }
    }

    /**
     * Fire-and-forget AI summary generation.
     * Errors are logged but never surfaced to the caller.
     */
    private triggerAiSummary(eventId: string, description: string): void {
        this.aiSummaryService
            .summarise(description)
            .then((summary) => {
                if (!summary) return;
                return this.eventModel.findByIdAndUpdate(eventId, { aiSummary: summary });
            })
            .catch((err) =>
                this.logger.error(`Failed to persist AI summary for event ${eventId}`, err),
            );
    }
}