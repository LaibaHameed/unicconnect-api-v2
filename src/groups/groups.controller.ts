import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, AppRole } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateJoinRequestDto } from './dto/create-join-request.dto';
import { DecideJoinRequestDto } from './dto/decide-join-request.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { GroupStatus } from './enums/group.enums';

@Controller('groups')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) { }

  // ✅ 1. STATIC routes first (no params)
  @Get()
  list(@Query() query: any) {
    return this.groupsService.listGroups(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/list')
  myGroups(@CurrentUser() user: any) {
    return this.groupsService.myGroups(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.createGroup(dto, user);
  }

  // ✅ 2. Specific sub-path routes before generic :groupId
  @UseGuards(JwtAuthGuard)
  @Get(':groupId/join-request/me')
  getMyJoinRequest(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    // ADD THIS LOG
    // console.log('DEBUG: Controller received user:', user?._id || user?.id);
    return this.groupsService.getMyJoinRequest(groupId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':groupId/join-requests')
  listJoinRequests(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.listJoinRequests(groupId, user);
  }

  @Get(':groupId/members')
  members(@Param('groupId') groupId: string) {
    return this.groupsService.listMembers(groupId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':groupId/join-request')
  joinRequest(
    @Param('groupId') groupId: string,
    @Body() dto: CreateJoinRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.createJoinRequest(groupId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':groupId/join-request/cancel')
  cancelJoinRequest(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.cancelMyJoinRequest(groupId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':groupId/join-requests/:requestId/decide')
  decideJoinRequest(
    @Param('groupId') groupId: string,
    @Param('requestId') requestId: string,
    @Body() dto: DecideJoinRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.decideJoinRequest(groupId, requestId, dto.decision, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':groupId/members/:userId/role')
  updateMemberRole(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.updateMemberRole(groupId, userId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':groupId/members/:userId')
  removeMember(
    @Param('groupId') groupId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.removeMember(groupId, userId, user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AppRole.SUPER_ADMIN)
  @Patch(':groupId/status/:status')
  decideStatus(
    @Param('groupId') groupId: string,
    @Param('status') status: GroupStatus.APPROVED | GroupStatus.REJECTED,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.decideGroupStatus(groupId, status, user);
  }

  // ✅ 3. Generic single :groupId routes LAST
  @Get(':groupId')
  get(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupById(groupId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':groupId')
  update(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.updateGroup(groupId, dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':groupId')
  remove(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.softDeleteGroup(groupId, user);
  }
}