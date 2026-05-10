// src/groups/groups.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { Group, GroupSchema } from './schemas/group.schema';
import { GroupMember, GroupMemberSchema } from './schemas/group-member.schema';
import { GroupJoinRequest, GroupJoinRequestSchema } from './schemas/group-join-request.schema';
import { UsersModule } from '../users/users.module';
import { GroupAdminHelper } from '../common/helpers/group-admin.helper';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    forwardRef(() => EventsModule),
    UsersModule,
    MongooseModule.forFeature([
      { name: Group.name, schema: GroupSchema },
      { name: GroupMember.name, schema: GroupMemberSchema },
      { name: GroupJoinRequest.name, schema: GroupJoinRequestSchema },
    ]),
  ],
  controllers: [GroupsController],
  providers: [
    GroupsService, 
    GroupAdminHelper // 1. Register it as a provider here
  ],
  exports: [
    GroupsService, 
    GroupAdminHelper // 2. Now you are allowed to export it
  ],
})
export class GroupsModule {}