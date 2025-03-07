import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { JwtAuthGuard } from 'src/app/auth/jwt.guard';
import { TwilioService } from '../services/twillio.service';
import { Public } from '../middleware/public.decorator';

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twilioService: TwilioService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      confirmPassword: string;
      phone: string;
      name: string;
    },
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.confirmPassword,
      body.phone,
      body.name,
    );
  }
  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const token = await this.authService.login(loginDto);
    if (!token) throw new UnauthorizedException('Invalid credentials');
    return token;
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    try {
      return await this.authService.resendVerificationEmail(email);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('send-otp')
  async sendOtp(@Body('phoneNumber') phoneNumber: string) {
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return this.twilioService.sendOTP(phoneNumber);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ) {
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return this.twilioService.verifyOTP(phoneNumber, code);
  }
}
