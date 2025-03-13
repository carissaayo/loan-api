import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  Param,
  Get,
  Patch,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/app/auth/jwt.guard';
import { AuthenticatedRequest, RolesGuard } from '../middleware/role.guard';
import { Roles } from '../middleware/role.decorator';
import { Role } from '../enums/roles.enum';
import { LoanService } from '../services/loan.service';
import { EmailVerifiedGuard } from 'src/app/auth/verified.guard';
import { CreateLoanDto } from '../dto/loan.dto';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard, EmailVerifiedGuard)
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Roles(Role.USER)
  @Post('request-loan')
  async requestLoan(
    @Req() req: AuthenticatedRequest,
    @Body('account_number') account_number: string,
    @Body('amount') amount: number,
    @Body('totalAmount') totalAmount: number,
    @Body('repaymentPeriod') repaymentPeriod: number,
    @Body(' paymentMethod') paymentMethod: string,
  ) {
    return this.loanService.requestLoan(
      account_number,
      amount,
      repaymentPeriod,
      totalAmount,
      paymentMethod,
      req.user,
    );
  }

  @Get(':loanId/get')
  async getSingleLoan(@Param('loanId') loanId: string) {
    if (!loanId) {
      throw new BadRequestException('Loan Id is required');
    }
    return this.loanService.getALoan(loanId);
  }

  @Get('')
  @Roles(Role.ADMIN, Role.FINANCE_ADMIN, Role.RISK_ASSESSOR)
  async getAllLoans() {
    return this.loanService.getAllLoans();
  }

  @Patch(':loanId/review')
  @Roles(Role.RISK_ASSESSOR)
  async reviewLoan(
    @Param('loanId') loanId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.reviewLoan(loanId, req);
  }

  @Roles(Role.RISK_ASSESSOR)
  @Patch(':loanId/approve')
  @Roles(Role.RISK_ASSESSOR)
  async approveLoan(
    @Param('loanId') loanId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.approveLoan(req, loanId);
  }

  @Patch(':loanId/reject')
  @Roles(Role.RISK_ASSESSOR)
  async rejectLoan(
    @Param('loanId') loanId: string,
    @Body('rejectionReason') rejectionReason: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.rejectLoan(req, loanId, rejectionReason);
  }

  @Patch(':loanId/disburse')
  @Roles(Role.FINANCE_ADMIN)
  async disburseLoan(
    @Param('loanId') loanId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.disburseLoan(loanId, req);
  }

  @Post(':loanId/repayment')
  @Roles(Role.USER)
  async initiateRepayment(
    @Param('loanId') loanId: string,
    @Body('amount') amount: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.startRepayment(loanId, req, amount);
  }

  @Post(':loanId/verify-payment')
  @Roles(Role.USER)
  async verifyRepayment(
    @Param('loanId') loanId: string,
    @Req() req: AuthenticatedRequest,
    @Body('reference') reference: string,
  ) {
    return this.loanService.verifyRepayment(loanId, reference, req);
  }
}
