import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Group, GroupDocument } from './schemas/group.schema';
import { GroupMember, GroupMemberDocument } from './schemas/group-member.schema';
import { GroupJoinRequest, GroupJoinRequestDocument } from './schemas/group-join-request.schema';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { JoinPolicy, GroupStatus, JoinRequestStatus, MemberRole } from './enums/group.enums';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AppRole } from '../auth/decorators/roles.decorator';
import { UsersService } from '../users/users.service';
import { UserProfile, UserProfileDocument } from 'src/profiles/schemas/user-profile.schema';

@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(Group.name) private readonly groupModel: Model<GroupDocument>,
    @InjectModel(GroupMember.name) private readonly memberModel: Model<GroupMemberDocument>,
    @InjectModel(GroupJoinRequest.name) private readonly joinRequestModel: Model<GroupJoinRequestDocument>,
    @InjectModel(UserProfile.name) private readonly userProfileModel: Model<UserProfileDocument>,
    private readonly usersService: UsersService
  ) { }

  private toObjectId = (id: string) => {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid id');
    return new Types.ObjectId(id);
  };

  private isSuperAdmin = (user: any) => user?.role === AppRole.SUPER_ADMIN;

  private assertGroupAdmin = async (groupId: Types.ObjectId, user: any) => {
    if (this.isSuperAdmin(user)) return;

    const membership = await this.memberModel.findOne({
      groupId,
      userId: user._id,
      isActive: true,
      role: MemberRole.ADMIN,
    });

    if (!membership) throw new ForbiddenException('Only group admin can perform this action');
  };

  // ============ GROUPS CRUD ============

  createGroup = async (dto: CreateGroupDto, user: any) => {
    try {
      const group = await this.groupModel.create({
        ...dto,
        createdBy: user._id,
        status: GroupStatus.PENDING,
      });

      return group;
    } catch (err: any) {
      if (err?.code === 11000) throw new BadRequestException('Group name already exists');
      throw err;
    }
  };

  listGroups = async (query: any) => {
    const filter: any = { isDeleted: false };

    if (query?.type) filter.type = query.type;
    if (query?.status) filter.status = query.status;
    if (query?.category) filter.category = query.category;

    return this.groupModel.find(filter).sort({ createdAt: -1 });
  };

  getGroupById = async (groupId: string) => {
    const _id = this.toObjectId(groupId);
    const group = await this.groupModel.findOne({ _id, isDeleted: false });
    if (!group) throw new NotFoundException('Group not found');
    return group;
  };

  updateGroup = async (groupId: string, dto: UpdateGroupDto, user: any) => {
    const _id = this.toObjectId(groupId);
    await this.assertGroupAdmin(_id, user);

    const updated = await this.groupModel.findOneAndUpdate(
      { _id, isDeleted: false },
      { $set: dto },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Group not found');
    return updated;
  };

  softDeleteGroup = async (groupId: string, user: any) => {
    const _id = this.toObjectId(groupId);
    await this.assertGroupAdmin(_id, user);

    const updated = await this.groupModel.findOneAndUpdate(
      { _id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Group not found');
    return { message: 'Deleted' };
  };

  // SUPER ADMIN: approve/reject group
  decideGroupStatus = async (
    groupId: string,
    status: GroupStatus.APPROVED | GroupStatus.REJECTED,
    user: any,
  ) => {
    const _id = this.toObjectId(groupId);

    const group = await this.groupModel.findOne({ _id, isDeleted: false });
    if (!group) throw new NotFoundException('Group not found');

    const updated = await this.groupModel.findOneAndUpdate(
      { _id },
      {
        $set: {
          status,
          approvedBy: user._id,
          approvedAt: new Date(),
        },
      },
      { new: true },
    );

    // If approved, auto-make creator an ADMIN member
    if (status === GroupStatus.APPROVED) {

      // Get creator user
      const creator = await this.usersService.findById(
        group.createdBy.toString(), // FIX: ObjectId -> string
      );

      if (!creator) {
        throw new NotFoundException('Creator not found');
      }

      await this.memberModel.updateOne(
        {
          groupId: _id,
          userId: group.createdBy,
        },
        {
          $set: {
            isActive: true,
            removedAt: null,
            email: creator.email, // IMPORTANT
          },
          $setOnInsert: {
            role: MemberRole.ADMIN,
          },
        },
        { upsert: true },
      );
    }

    return updated;
  };

  // ============ JOIN REQUESTS ============

  createJoinRequest = async (groupId: string, dto: CreateJoinRequestDto, user: any) => {
    const userDoc = await this.usersService.findById(user._id);
    if (!userDoc?.profileCompleted) {
      throw new BadRequestException('Please complete your profile before joining groups');
    }

    const _id = this.toObjectId(groupId);

    const group = await this.getGroupById(groupId);
    if (group.status !== GroupStatus.APPROVED) throw new ForbiddenException('Group not approved');

    const existingMember = await this.memberModel.findOne({
      groupId: _id,
      userId: user._id,
      isActive: true,
    });
    if (existingMember) throw new BadRequestException('Already a member');

    if (group.joinPolicy === JoinPolicy.INVITE_ONLY) {
      throw new ForbiddenException('Invite-only group');
    }

    // OPEN join -> directly become member
    if (group.joinPolicy === JoinPolicy.OPEN) {
      await this.memberModel.updateOne(
        { groupId: _id, userId: user._id },
        {
          $set: {
            isActive: true,
            removedAt: null,
            email: user.email,
          },
          $setOnInsert: {
            role: MemberRole.MEMBER,
          },
        },
        { upsert: true },
      );

      return { message: 'Joined successfully' };
    }

    // APPROVAL_REQUIRED: create pending request (avoid duplicates)
    const pending = await this.joinRequestModel.findOne({
      groupId: _id,
      userId: user._id,
      status: JoinRequestStatus.PENDING,
    });
    if (pending) throw new BadRequestException('Join request already pending');

    return this.joinRequestModel.create({
      groupId: _id,
      userId: user._id,
      note: dto?.note || '',
      status: JoinRequestStatus.PENDING,
    });
  };

  listJoinRequests = async (groupId: string, user: any) => {
    const _id = this.toObjectId(groupId);
    await this.assertGroupAdmin(_id, user);

    return this.joinRequestModel
      .find({ groupId: _id })
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
  };

  decideJoinRequest = async (
    groupId: string,
    requestId: string,
    decision: JoinRequestStatus.APPROVED | JoinRequestStatus.REJECTED,
    user: any,
  ) => {
    const gId = this.toObjectId(groupId);
    const rId = this.toObjectId(requestId);

    await this.assertGroupAdmin(gId, user);

    const reqDoc = await this.joinRequestModel.findOne({
      _id: rId,
      groupId: gId,
      status: JoinRequestStatus.PENDING,
    });

    if (!reqDoc) throw new NotFoundException('Pending request not found');

    await this.joinRequestModel.updateOne(
      { _id: rId },
      { $set: { status: decision, actionBy: user._id, email: user.email, actionAt: new Date() } },
    );

    if (decision === JoinRequestStatus.APPROVED) {
      const requestUser = await this.usersService.findById(
        reqDoc.userId.toString(),
      );

      if (!requestUser) {
        throw new NotFoundException('User not found');
      }

      await this.memberModel.updateOne(
        { groupId: gId, userId: reqDoc.userId },
        {
          $set: {
            isActive: true,
            removedAt: null,
            email: requestUser.email,
          },
          $setOnInsert: {
            role: MemberRole.MEMBER,
          },
        },
        { upsert: true },
      );
    }

    return { message: `Request ${decision.toLowerCase()}` };
  };

  cancelMyJoinRequest = async (groupId: string, user: any) => {
    const gId = this.toObjectId(groupId);

    const pending = await this.joinRequestModel.findOne({
      groupId: gId,
      userId: user._id,
      status: JoinRequestStatus.PENDING,
    });

    if (!pending) throw new NotFoundException('No pending request to cancel');

    await this.joinRequestModel.updateOne(
      { _id: pending._id },
      { $set: { status: JoinRequestStatus.CANCELLED, actionBy: user._id, actionAt: new Date() } },
    );

    return { message: 'Request cancelled' };
  };

  getMyJoinRequest = async (groupId: string, user: any) => {
    const gId = this.toObjectId(groupId);
    const uId = this.toObjectId(user._id);

    const result = await this.joinRequestModel.findOne({
      groupId: gId,
      userId: uId,
      status: JoinRequestStatus.PENDING,
    });

    // ADD THIS LOG
    // console.log('DEBUG: DB Fetch Join Request', {
    //   searchingForUser: uId,
    //   searchingForGroup: gId,
    //   foundRecord: !!result,
    //   statusFound: result?.status
    // });

    return result;
  };

  // ============ MEMBERS ============

  listMembers = async (groupId: string) => {
    const gId = this.toObjectId(groupId);

    // 1. Fetch members and populate user info
    const members = await this.memberModel
      .find({
        groupId: gId,
        isActive: true,
      })
      .populate('userId', 'email')
      .lean();

    // 2. Extract User IDs and ensure they are cast to ObjectId for the query
    // Filter out any potential nulls to prevent query errors
    const userIds = members
      .map((member: any) => member.userId?._id)
      .filter((id) => id != null)
      .map((id) => new Types.ObjectId(id));

    if (userIds.length === 0) return members;
    // console.log('Searching for Profiles with IDs:', userIds);

    // 3. Fetch profiles using the casted ObjectIds
    const profiles = await this.userProfileModel
      .find({
        userId: { $in: userIds },
      })
      .select('userId fullName username profileImageUrl')
      .lean();

    // console.log(' Profiles with IDs:', profiles);
    // 4. Create the Map using String keys for guaranteed matching
    const profileMap = new Map(
      profiles.map((profile: any) => [
        profile.userId.toString(), // Always stringify the key
        profile,
      ]),
    );


    // 5. Merge data
    return members.map((member: any) => {
      const memberIdStr = member.userId?._id?.toString();
      const profile = memberIdStr ? profileMap.get(memberIdStr) : null;

      return {
        ...member,
        fullName: profile?.fullName || 'Unknown User',
        username: profile?.username || '',
        profileImage: profile?.profileImageUrl || '',
        email: member.userId?.email || '',
      };
    });
  };

  updateMemberRole = async (groupId: string, memberUserId: string, dto: UpdateMemberRoleDto, user: any) => {
    const gId = this.toObjectId(groupId);
    const uId = this.toObjectId(memberUserId);

    await this.assertGroupAdmin(gId, user);

    if (String(uId) === String(user._id)) {
      throw new BadRequestException('You cannot change your own role');
    }

    const updated = await this.memberModel.findOneAndUpdate(
      { groupId: gId, userId: uId, isActive: true },
      { $set: { role: dto.role } },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Member not found');
    return updated;
  };

  removeMember = async (groupId: string, memberUserId: string, user: any) => {
    const gId = this.toObjectId(groupId);
    const uId = this.toObjectId(memberUserId);

    await this.assertGroupAdmin(gId, user);

    const adminCount = await this.memberModel.countDocuments({
      groupId: gId,
      role: MemberRole.ADMIN,
      isActive: true,
    });

    const member = await this.memberModel.findOne({
      groupId: gId,
      userId: uId,
      isActive: true,
    });

    if (
      member?.role === MemberRole.ADMIN &&
      adminCount <= 1
    ) {
      throw new BadRequestException(
        'Cannot remove the last admin of the group',
      );
    }

    const updated = await this.memberModel.findOneAndUpdate(
      { groupId: gId, userId: uId, isActive: true },
      { $set: { isActive: false, removedAt: new Date() } },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Member not found');
    return { message: 'Member removed' };
  };

  myGroups = async (user: any) => {
    const memberships = await this.memberModel.find({ userId: user._id, isActive: true });
    const groupIds = memberships.map((m) => m.groupId);
    return this.groupModel.find({ _id: { $in: groupIds }, isDeleted: false });
  };

  /**
 * Fetches all active member emails for a given group.
 * Uses population to avoid manual loops and multiple queries.
 */
  async getGroupMemberEmails(groupId: Types.ObjectId | string): Promise<string[]> {
    const members = await this.memberModel.find(
      {
        groupId,
        isActive: true,
      },
      {
        email: 1,
        _id: 0,
      },
    );
    console.log('RAW MEMBERS:', members);
    const emails = members.map((m) => m.email).filter(Boolean);
    console.log('FINAL EMAILS:', emails);
    return emails;
  }

}
