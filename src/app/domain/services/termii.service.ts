import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TermiiService {
  constructor(private readonly configService: ConfigService) {}

  async requestForSenderId() {
    try {
      const url = `${this.configService.get<string>('TERMII_BASE_URL')}/api/sender-id/request`;
      const payload = {
        api_key: this.configService.get<string>('TERMII_API_KEY'),
        sender_id: 'JustADev',
        usecase: 'Your OTP code is 234567',
        company: 'JustADev',
      };
      const response = await axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error(
        'Termii SenderId request failed:',
        error.response?.data || error.message,
      );
      throw new Error('Failed SenderId request');
    }
  }
  async sendVerificationCode(phoneNumber: string, code: string): Promise<any> {
    const url = `${this.configService.get<string>('TERMII_BASE_URL')}/api/sms/send`;
    const payload = {
      to: phoneNumber,
      from: this.configService.get<string>('TERMII_SENDER_ID'),
      sms: `Your verification code is: ${code}`,
      type: 'plain',
      channel: 'generic',
      api_key: this.configService.get<string>('TERMII_API_KEY'),
    };

    try {
      const response = await axios.post(url, payload);
      return response.data;
    } catch (error) {
      console.error('Termii SMS Error:', error.response?.data || error.message);
      throw new Error('Failed to send SMS verification code');
    }
  }
}
