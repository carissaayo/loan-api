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
import * as nodemailer from 'nodemailer';

import { User, UserDocument } from '../schemas/user.schema';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { name, email, password, confirmPassword, phone } = registerDto;
    if (password !== confirmPassword) {
      throw new ConflictException('Passwords do not match');
    }
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new this.userModel({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    user.save();
    // Generate a verification token
    const verificationToken = this.jwtService.sign(
      { email: user.email },
      { secret: this.configService.get<string>('JWT_SECRET'), expiresIn: '1d' },
    );

    await this.sendVerificationEmail(user.email, verificationToken);

    return user;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });

    const userDetails = { email, name: user.name, phone: user.phone };
    // Generate JWT token
    return { accessToken, userDetails };
  }

  async sendVerificationEmail(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USERNAME'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });

    const verificationLink = `${this.configService.get<string>('APP_URL')}/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USERNAME'),
      to: email,
      subject: 'Email Verification',
      text: `Click the link below to verify your email:\n\n${verificationLink}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully!'); // Debug log
    } catch (error) {
      console.error('Error sending email:', error); // Debug log
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
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

    await this.sendVerificationEmail(user.email, verificationToken);
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
