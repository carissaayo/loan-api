import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import { User, UserDocument } from '../user/user.schema';
import { LoginDto } from '../domain/dto/auth.dto';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(
    email: string,
    password: string,
    confirmPassword: string,
    phone: string,
    name: string,
  ) {
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }
    if (password !== confirmPassword) {
      throw new UnauthorizedException('Passwords do not match');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = new this.userModel({
        email,
        password: hashedPassword,
        phone,
        name,
      });
      await user.save();
      const { role, isVerified, _id } = user;
      // Generate a verification token
      const token = this.jwtService.sign({ email }, { expiresIn: '1d' });

      await this.emailService.sendVerificationEmail(email, token);

      return {
        message:
          'User registered successfully. Check your email for the verification link.',
        user: {
          email,
          phone,
          name,
          isVerified,
          role,
          _id,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({
      email,
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
    };
    const accessToken = this.jwtService.sign(payload);
    const userDetails = {
      email: user.email,
      phone: user.phone,
      role: user.role,
      name: user.name,
      isVerified: user.isVerified,
      id: user._id,
    };
    return { accessToken, userDetails };
  }

  async resendVerificationEmail(email: string): Promise<string> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate a new verification token
    const verificationToken = this.jwtService.sign(
      { email: user.email },
      { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '1d' },
    );

    await this.emailService.sendVerificationEmail(email, verificationToken);

    return 'Verification email resent successfully!';
  }

  async verifyEmail(token: string): Promise<string> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userModel.findOne({ email: payload.email });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isVerified) {
        throw new BadRequestException('Email is already verified');
      }

      user.isVerified = true;
      await user.save();

      return 'Email successfully verified!';
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }
}
