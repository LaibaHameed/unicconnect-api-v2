import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProfile, UserProfileDocument } from './schemas/user-profile.schema';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(UserProfile.name)
    private readonly profileModel: Model<UserProfileDocument>,
  ) {}

  createEmptyProfile = async (userId: Types.ObjectId) => {
    try {
      const suffix = userId.toString().slice(-6);
      const username = `user_${suffix}`.toLowerCase();

      const profile = await this.profileModel.create({
        userId,
        fullName: '',
        username,
        showEmailToSocietyAdmins: true,
      });

      return profile;
    } catch (error: any) {
      // if username collides (rare), fallback
      if (error?.code === 11000) {
        const username = `user_${userId.toString()}`.slice(0, 30).toLowerCase();
        return this.profileModel.create({ userId, fullName: '', username });
      }
      throw error;
    }
  };

  updateProfileByUserId = async (
    userId: Types.ObjectId,
    data: Partial<UserProfile>,
  ) => {
    try {
      if (data.username) data.username = String(data.username).toLowerCase();

      // handle duplicate username/studentId nicely
      try {
        return await this.profileModel
          .findOneAndUpdate({ userId }, { $set: data }, { new: true })
          .exec();
      } catch (e: any) {
        if (e?.code === 11000) throw new ConflictException('Username or studentId already in use');
        throw e;
      }
    } catch (error) {
      throw error;
    }
  };

  findByUserId = async (userId: Types.ObjectId) => {
    return this.profileModel.findOne({ userId }).exec();
  };
}
