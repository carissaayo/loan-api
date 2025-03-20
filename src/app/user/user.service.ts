import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { Role } from '../domain/enums/roles.enum';
import { RedisService } from '../domain/services/redis.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly redisService: RedisService,
  ) {}

  async assignRole(
    requestingUser: User,
    userId: string,
    newRole: Role,
  ): Promise<any> {
    // Check if the requesting user is actually an admin
    if (requestingUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only an admin can change user roles');
    }

    // Find the user whose role is being changed
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!newRole) {
      throw new ForbiddenException('new role has to be provided');
    }

    // Update role
    user.role = newRole;
    const userRoleChanged = await user.save();
    return {
      message: 'Role has been changed',
      user: userRoleChanged,
    };
  }

  async getUserById(userId: string): Promise<any> {
    const cacheKey = `user:${userId}`;

    // Try getting data from Redis cache
    const cachedUser = await this.redisService.get(cacheKey);
    if (cachedUser) return JSON.parse(cachedUser);

    // Fetch from MongoDB if not cached
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');
    const userDetails = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isVerified: user.isVerified,
      ownedAmount: user.ownedAmount,
      loans: user.loans,
      role: user.role,
      banks: user.banks,
    };

    // Cache the user data for 1 hour (3600 seconds)
    await this.redisService.set(cacheKey, userDetails, 3600);

    return userDetails;
  }
  async findUser(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();

    if (user) {
      const { password, ...userDetails } = user.toObject();

      return userDetails;
    }

    throw new NotFoundException('User not found');
  }
  async getAllUsers(): Promise<any> {
    const users = await this.userModel.find({ role: 'user' }).exec();

    if (!users) {
      throw new NotFoundException('no users found');
    }
    return { message: 'all users fetched successfully', users };
  }

  async findUserByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.findUserByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }
}
