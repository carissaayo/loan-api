import {
  Controller,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Headers,
  Get,
} from '@nestjs/common';
import { PaystackService } from '../services/paystack.service';
import { JwtAuthGuard } from 'src/app/auth/jwt.guard';
import * as crypto from 'crypto';

@Controller('paystack')
@UseGuards(JwtAuthGuard) // Protect routes
export class PaystackController {
  constructor(private readonly paystackService: PaystackService) {}

  @Get('banks')
  async getBanks() {
    return this.paystackService.GetBank();
  }

  @Post('disburse-loan')
  async disburseLoan(
    @Body()
    {
      recipientAccountNumber,
      amount,
      reason,
    }: {
      recipientAccountNumber: string;
      amount: number;
      reason: string;
    },
  ) {
    return this.paystackService.initiateTransfer(
      recipientAccountNumber,
      amount,
      reason,
    );
  }

  @Post('verify-payment')
  async verifyPayment(@Query('reference') reference: string) {
    return this.paystackService.verifyTransaction(reference);
  }
  @Post('webhook')
  async handleWebhook(
    @Req() req,
    @Headers('x-paystack-signature') signature: string,
  ) {
    const secret = process.env.PAYSTACK_SECRET;
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
}
