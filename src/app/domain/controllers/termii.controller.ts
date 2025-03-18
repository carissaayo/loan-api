import { Controller, Post, Body } from '@nestjs/common';
import { TermiiService } from '../services/termii.service';

@Controller('termi')
export class AuthController {
  constructor(private readonly termiiService: TermiiService) {}

  @Post('sender-id/request')
  async requestSenderId() {
    const response = await this.termiiService.requestForSenderId();
    return { message: 'request sent', response };
  }

  @Post('send-otp')
  async sendOtp(@Body('phoneNumber') phoneNumber: string) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const response = await this.termiiService.sendVerificationCode(
      phoneNumber,
      otpCode,
    );
    return { message: 'OTP sent', response };
  }
}
