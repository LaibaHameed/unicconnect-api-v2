import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProfile, UserProfileDocument } from './schemas/user-profile.schema';
import { ProfileSetupDto } from './dto/profile-setup.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(UserProfile.name)
    private readonly profileModel: Model<UserProfileDocument>,
  ) { }

  findByUserId = async (userId: Types.ObjectId) => {
    return this.profileModel.findOne({ userId }).exec();
  };

  createProfile = async (userId: Types.ObjectId, dto: ProfileSetupDto) => {
    try {
      const exists = await this.profileModel.findOne({ userId }).exec();
      if (exists) throw new ConflictException('Profile already exists');

      const profile = new this.profileModel({
        userId,
        fullName: dto.fullName.trim(),
        username: dto.username.toLowerCase().trim(),
        universityName: dto.universityName ?? null,
        department: dto.department ?? null,
        degreeProgram: dto.degreeProgram ?? null,
      });

      return await profile.save();
    } catch (error: any) {
      if (error?.code === 11000) throw new ConflictException('Username or studentId already in use');
      throw error;
    }
  };


  updateProfile = async (userId: Types.ObjectId, data: Partial<UserProfile>) => {
    try {
      if (data.username) data.username = String(data.username).toLowerCase().trim();

      const updated = await this.profileModel
        .findOneAndUpdate({ userId }, { $set: data }, { new: true })
        .exec();

      if (!updated) throw new NotFoundException('Profile not found');
      return updated;
    } catch (error: any) {
      if (error?.code === 11000) throw new ConflictException('Username or studentId already in use');
      throw error;
    }
  };
}
