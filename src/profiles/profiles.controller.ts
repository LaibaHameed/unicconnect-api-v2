import { Body, Controller, Get, Patch, Post, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProfileSetupDto } from './dto/profile-setup.dto';
import { UsersService } from '../users/users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
@UsePipes(new ValidationPipe({ whitelist: true }))
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly usersService: UsersService,
  ) { }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: any) {
    const profile = await this.profilesService.findByUserId(user._id);
    return {
      profileCompleted: user.profileCompleted,
      profile,
    };
  }

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  async setup(@CurrentUser() user: any, @Body() dto: ProfileSetupDto) {
    const profile = await this.profilesService.createProfile(user._id, dto);

    await this.usersService.updateById(user._id.toString(), {
      profileCompleted: true,
      profile: profile._id,
    });

    return {
      message: 'Profile created.',
      profileCompleted: true,
      profile,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user._id, dto);
  }

}
