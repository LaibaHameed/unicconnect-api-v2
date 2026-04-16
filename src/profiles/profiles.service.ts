import { ConflictException, Injectable } from '@nestjs/common';
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
      const payload = {
        userId,
        fullName: dto.fullName.trim(),
        username: dto.username.toLowerCase().trim(),
        universityName: dto.universityName ?? null,
        department: dto.department ?? null,
        degreeProgram: dto.degreeProgram ?? null,
        degreeLevel: dto.degreeLevel ?? null,
        semester: dto.semester ?? null,
      };

      const result = await this.profileModel.findOneAndUpdate(
        { userId },
        { $setOnInsert: payload },
        { new: true, upsert: true }
      );

      return result;
    } catch (error: any) {
      console.log("CREATE PROFILE ERROR:", {
        code: error?.code,
        keyPattern: error?.keyPattern,
        keyValue: error?.keyValue,
        message: error?.message,
      });

      if (error?.code === 11000) {
        const field = Object.keys(error?.keyPattern || {})[0] || "field";
        const value = error?.keyValue?.[field];
        throw new ConflictException(`${field} already in use (${value})`);
      }
      throw error;
    }

  };

  updateProfile = async (userId: Types.ObjectId, data: Partial<UserProfile>) => {
    try {
      if (data.username) data.username = String(data.username).toLowerCase().trim();

      // Use { upsert: true } to create it if it doesn't exist
      const updated = await this.profileModel
        .findOneAndUpdate(
          { userId },
          { $set: data },
          { new: true, upsert: true }
        )
        .exec();

      return updated;
    } catch (error: any) {
      // Handle duplicate username errors
      if (error?.code === 11000) {
        throw new ConflictException('Username or Student ID already in use');
      }
      throw error;
    }
  };
}
