import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { AccountNumberDto } from '../dto/user.dto';
import { UsersService } from './user.service';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PaystackService {
  private readonly PAYSTACK_SECRET: string;

  constructor(
    private configService: ConfigService,
    private userService: UsersService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}
  async GetBank() {
    try {
      const response = await axios.get(
        `${this.configService.get<string>('PAYSTACK_BASE_URL')}/bank`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      console.log(response.data);

      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Paystack transfer failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async addAccountNumber(
    accountDetails: AccountNumberDto,
    req: any,
  ): Promise<any> {
    try {
      const user = await this.userService.findUser(req.user.userId);
      const doesAccountExist = user?.banks.filter(
        (bank) => bank.account_number === accountDetails.account_number,
      )[0];
      if (doesAccountExist) {
        throw new BadRequestException('Account number already exist');
      }
      const response = await axios.post(
        `${this.configService.get<string>('PAYSTACK_BASE_URL')}/transferrecipient`,
        {
          type: 'nuban',
          currency: 'NGN',
          ...accountDetails,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const bank = {
        recipient_code: response.data.data.recipient_code,
        account_number: response.data.data.details.account_number,
        bank_code: response.data.data.details.bank_code,
        account_name: response.data.data.details.account_name,
        bank_name: response.data.data.details.bank_name,
      };

      await this.userModel.findByIdAndUpdate(
        req.user.userId,
        {
          $push: { banks: bank },
        },
        { new: true },
      );

      return {
        message: 'Account details has been added',
        data: response.data,
      };
    } catch (error) {
      console.log(error);

      throw new HttpException(
        error || 'Paystack transfer failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  async initiateTransfer(amount: number, recipient: string, reason: string) {
    try {
      const response = await axios.post(
        `${this.configService.get<string>('PAYSTACK_BASE_URL')}/transfer`,
        {
          source: 'balance',
          reason,
          amount: amount * 100, // Convert to kobo
          recipient: recipient,
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
      console.log(error);

      throw new HttpException(
        error.response?.data || 'Paystack transfer failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.configService.get<string>('PAYSTACK_BASE_URL')}/transaction/verify/${reference}`,
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
