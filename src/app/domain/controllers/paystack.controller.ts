import {
  Controller,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Headers,
  Get,
  Request,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PaystackService } from '../services/paystack.service';
import { JwtAuthGuard } from 'src/app/auth/jwt.guard';
import * as crypto from 'crypto';
import { AuthenticatedRequest, RolesGuard } from '../middleware/role.guard';
import { Roles } from '../middleware/role.decorator';
import { Role } from '../enums/roles.enum';
import { EmailVerifiedGuard } from 'src/app/auth/verified.guard';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Loan,
  LoanDocument,
  LoanSchema,
  LoanStatus,
} from '../schemas/loan.schema';

@Controller('paystack')
@UseGuards(JwtAuthGuard, RolesGuard, EmailVerifiedGuard)
export class PaystackController {
  constructor(
    private readonly paystackService: PaystackService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
  ) {}

  @Get('banks')
  async getBanks() {
    return this.paystackService.GetBank();
  }

  @Roles(Role.USER)
  @Post('create-recipient')
  async createRecipient(
    @Body('account_number') account_number: string,
    @Body('name') name: string,
    @Body('bank_code') bank_code: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const accountDetails = { account_number, name, bank_code };

    return this.paystackService.addAccountNumber(accountDetails, req);
  }

  @Post('verify-payment')
  async verifyPayment(@Query('reference') reference: string) {
    return this.paystackService.verifyRepayment(reference);
  }
  @Post('webhook')
  async handleWebhook(
    @Req() req,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const secret = this.configService.get<string>('PAYSTACK_SECRET');
    const hash = crypto
      .createHmac('sha512', secret || 'just_kidding')
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      return { status: 'error', message: 'Invalid signature' };
    }

    const event = req.body;
    if (event.event === 'charge.success') {
      // Handle successful repayment
    }

    return { status: 'success' };
  }

  @Post('paystack/webhook')
  async paystackWebhook(@Request() req) {
    const secret = this.configService.get<string>('PAYSTACK_SECRET');

    // Verify signature
    const hash = crypto
      .createHmac('sha512', secret || 'just kidding')
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
      throw new ForbiddenException('Invalid Paystack signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const { email, amount } = event.data;
      // const user = await this.userModel.findOne({ email });
      //   if (!user) {
      //       throw new NotFoundException('User not found');
    }
    //         const loanId= user.loans.filter(loan=>loan.status===LoanStatus.DISBURSED);
    // const loan = await this.loanModel.findById(loanId);
    //   if (!loan) throw new NotFoundException('Loan not found');

    //       const repaymentAmount = amount / 100; // Convert from kobo to NGN

    //       // Deduct from loan balance
    //       user.loanBalance = Math.max(user.loanBalance - repaymentAmount, 0);
    //       await user.save();

    // }

    return { status: 'success' };
  }
}
