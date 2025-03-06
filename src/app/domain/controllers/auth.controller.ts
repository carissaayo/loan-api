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

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const token = await this.authService.login(loginDto);
    if (!token) throw new UnauthorizedException('Invalid credentials');
    return token;
  }

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

  // @UseGuards(JwtAuthGuard)
  // @Post('send-otp')
  // async sendOtp(@Body('phone') phone: string) {
  //   return await this.authService.sendPhoneOtp(phone);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Post('verify-phone')
  // async verifyPhone(@Body('OTP') otp: string) {
  //   return await this.authService.verifyPhoneToken(otp);
  // }
}
