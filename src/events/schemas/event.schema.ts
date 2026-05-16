import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EventMode, EventStatus, EventType } from '../enums/event.enums';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
    @Prop({ type: Types.ObjectId, ref: 'Group', required: true })
    groupId!: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy!: Types.ObjectId;

    // Core info
    @Prop({ type: String, required: true, trim: true })
    title!: string;

    @Prop({ type: String, required: true })
    description!: string;

    @Prop({ type: String, default: null })
    aiSummary!: string | null;

    // Classification
    @Prop({ type: String, required: true, enum: EventType })
    eventType!: EventType;

    @Prop({ type: String, required: true, enum: EventMode })
    mode!: EventMode;

    @Prop({
        type: String,
        required: true,
        enum: EventStatus,
        default: EventStatus.DRAFT,
    })
    status!: EventStatus;

    // Scheduling
    @Prop({ type: Date, required: true })
    startDateTime!: Date;

    @Prop({ type: Date, required: true })
    endDateTime!: Date;

    // Location
    @Prop({ type: String, default: null, trim: true })
    venue!: string | null;

    // Media & links
    @Prop({ type: String, default: null })
    bannerUrl!: string | null;

    @Prop({ type: String, default: null, trim: true })
    registrationLink!: string | null;

    @Prop({ type: [String], default: [] })
    tags!: string[];

    // Soft delete
    @Prop({ type: Boolean, default: false })
    isDeleted!: boolean;

    @Prop({ type: Date, default: null })
    deletedAt!: Date | null;

    // Contact Information
    @Prop({ type: String, default: null, trim: true })
    whatsappNumber!: string | null;

    @Prop({ type: String, default: null, trim: true })
    contactEmail!: string | null;

    @Prop({ type: String, default: null, trim: true })
    instagramHandle!: string | null;

    // Registration Logic
    @Prop({ type: Boolean, default: false })
    isRegistrationRequired!: boolean;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index({ groupId: 1, status: 1, isDeleted: 1 });
EventSchema.index({ startDateTime: 1, status: 1 });
EventSchema.index({ eventType: 1, mode: 1, status: 1 });