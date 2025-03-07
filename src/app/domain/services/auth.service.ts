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
import { FirebaseService } from './firebase.service';
import { TwilioService } from './twillio.service';
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    // private readonly firebaseService: FirebaseService,
    private readonly twilioService: TwilioService,
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

    // Hash password before storing in MongoDB
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create Firebase user
      //   const firebaseUser = await this.firebaseService.createFirebaseUser(
      //     email,
      //     password,
      //     phone,
      //   );

      // Create User in MongoDB with Firebase UID
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

      await this.sendVerificationEmail(email, token);

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
    // Verify credentials with Firebase
    // const firebaseUser = await this.firebaseService.verifyUser(email);
    // if (!firebaseUser) {
    //   throw new UnauthorizedException('No user found with the email');
    // }

    // Find user in MongoDB using Firebase UID
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
    };
    const accessToken = this.jwtService.sign(payload);
    const userDetails = {
      email: user.email,
      phone: user.phone,
      role: user.role,
      name: user.name,
    };
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

  async sendOtp(phone: string): Promise<any> {
    return await this.twilioService.sendOTP(phone);
  }

  async verifyOTP(phone: string, code: string): Promise<any> {
    return await this.twilioService.verifyOTP(phone, code);
  }
}
