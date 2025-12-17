import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ProfilesService } from '../profiles/profiles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly profilesService: ProfilesService,
  ) { }

  createUser = async (data: Partial<User>) => {
    try {
      const user = new this.userModel({
        ...data,
        email: String(data.email).toLowerCase().trim(),
      });
      return await user.save();
    } catch (error) {
      throw error;
    }
  };


  findByEmail = async (email: string) => {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  };

  findById = async (id: string) => {
    return this.userModel.findById(id).exec();
  };

  createUserAndProfile = async (data: {
    email: string;
    password: string;
  }) => {
    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      const user = await this.userModel.create(
        [
          {
            email: data.email.toLowerCase().trim(),
            password: data.password,
          },
        ],
        { session },
      );

      const savedUser = user[0];

      const profile = await this.profilesService.createEmptyProfile(savedUser._id);

      savedUser.profile = profile._id as unknown as Types.ObjectId;
      savedUser.profileCompleted = false;

      await savedUser.save({ session });

      await session.commitTransaction();
      session.endSession();

      return savedUser;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  };

  updateByEmail = async (email: string, data: Partial<User>) => {
    return this.userModel
      .findOneAndUpdate({ email: email.toLowerCase().trim() }, { $set: data }, { new: true })
      .exec();
  };

  updateById = async (id: string, data: Partial<User>) => {
    return this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  };
}
