import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';
import { Role } from '../enums/roles.enum';
import axios from 'axios';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
    console.log(newRole);
    console.log(user);

    // Update role
    user.role = newRole;
    const userRoleChanged = await user.save();
    return {
      message: 'Role has been changed',
      user: userRoleChanged,
    };
  }
  async findUser(userId: any): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (user) {
      const { password, ...userDetails } = user.toObject();

      return userDetails;
    }

    throw new NotFoundException('User not found');
  }
  async addAccountNumber(accountNumber: any): Promise<any> {
    // const banks =axios.get()
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
