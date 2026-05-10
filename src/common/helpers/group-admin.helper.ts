import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { GroupMember, GroupMemberDocument } from '../../groups/schemas/group-member.schema';
import { MemberRole } from '../../groups/enums/group.enums';

/**
 * Standalone helper — inject this into any service that needs group-admin checks.
 *
 * Usage:
 *   constructor(private readonly groupAdminHelper: GroupAdminHelper) {}
 *   await this.groupAdminHelper.verifyGroupAdmin(userId, groupId);
 */
@Injectable()
export class GroupAdminHelper {
    constructor(
        @InjectModel(GroupMember.name)
        private readonly groupMemberModel: Model<GroupMemberDocument>,
    ) { }

    /**
     * Throws if the user is not an active ADMIN or OWNER of the group.
     * Returns the membership document on success so callers can use it
     * without an extra DB round-trip.
     */
    async verifyGroupAdmin(
        userId: string | Types.ObjectId,
        groupId: string | Types.ObjectId,
    ): Promise<GroupMemberDocument> {
        const membership = await this.groupMemberModel
            .findOne({
                groupId: new Types.ObjectId(groupId.toString()),
                userId: new Types.ObjectId(userId.toString()),
                role: { $in: [MemberRole.ADMIN, MemberRole.ADMIN] },
                isActive: true,
            })
            .lean()
            .exec();

        if (!membership) {
            throw new ForbiddenException(
                'You must be an active admin of this group to perform this action.',
            );
        }

        return membership as GroupMemberDocument;
    }

    /**
     * Returns true/false without throwing — useful for conditional logic.
     */
    async isGroupAdmin(
        userId: string | Types.ObjectId,
        groupId: string | Types.ObjectId,
    ): Promise<boolean> {
        const exists = await this.groupMemberModel.exists({
            groupId: new Types.ObjectId(groupId.toString()),
            userId: new Types.ObjectId(userId.toString()),
            role: { $in: [MemberRole.ADMIN, MemberRole.ADMIN] },
            isActive: true,
        });

        return !!exists;
    }
}