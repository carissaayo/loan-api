// twilio.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioService {
  constructor(
    private configService: ConfigService,
    @Inject('TWILIO_CLIENT') private readonly twilioClient: Twilio,
  ) {}

  async sendOTP(phoneNumber: string): Promise<string> {
    // const serviceSid = this.configService.get<string>('TWILIO_SERVICE_SID');
    const verification = await this.twilioClient.verify.v2
      .services(
        this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID') as string,
      )
      .verifications.create({ to: phoneNumber, channel: 'sms' });
    return `OTP sent: ${verification.status}`;
  }

  async verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    // const serviceSid = this.configService.get<string>('TWILIO_SERVICE_SID');
    const verificationCheck = await this.twilioClient.verify.v2
      .services(
        this.configService.get<string>('TWILIO_VERIFY_SERVICE_SID') as string,
      )
      .verificationChecks.create({ to: phoneNumber, code });
    return verificationCheck.status === 'approved';
  }
}
