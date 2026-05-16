import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schemas/event.schema';
import { AiSummaryModule } from './../ai-summary/ai-summary.module';
import { GroupsModule } from 'src/groups/groups.module';
import { AiSummaryService } from 'src/ai-summary/ai-summary.service';
import { MailModule } from 'src/mail/mail.module';
import { GroupMember, GroupMemberSchema } from 'src/groups/schemas/group-member.schema';

@Module({
  imports: [
    forwardRef(() => GroupsModule),
    AiSummaryModule,
    MailModule,
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: GroupMember.name, schema: GroupMemberSchema },
    ]),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService]
})
export class EventsModule { }
