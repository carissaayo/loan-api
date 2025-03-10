import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackService {
  private readonly PAYSTACK_SECRET: string;
  private readonly PAYSTACK_BASE_URL = 'https://api.paystack.co';

  constructor(private configService: ConfigService) {
    // this.PAYSTACK_SECRET = this.configService.get<string>('PAYSTACK_SECRET');
  }
  async GetBank() // accountNumber: string,
  {
    try {
      const response = await axios.get(`${this.PAYSTACK_BASE_URL}/bank`, {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET')}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(response.data);

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Paystack transfer failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  async initiateTransfer(
    accountNumber: string,
    amount: number,
    reason: string,
  ) {
    try {
      const response = await axios.post(
        `${this.PAYSTACK_BASE_URL}/transfer`,
        {
          source: 'balance',
          reason,
          amount: amount * 100, // Convert to kobo
          recipient: accountNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Paystack transfer failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.PAYSTACK_SECRET}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Transaction verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
