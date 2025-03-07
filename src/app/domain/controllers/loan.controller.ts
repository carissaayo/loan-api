import { Controller, Post, Body, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/app/auth/jwt.guard';
import { RolesGuard } from '../middleware/role.guard';
import { Roles } from '../middleware/role.decorator';
import { Role } from '../enums/roles.enum';
import { LoanService } from '../services/loan.service';

@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post('request')
  @UseGuards(JwtAuthGuard)
  async requestLoan(@Body() loanDto, @Body('userId') userId: string) {
    return this.loanService.requestLoan(loanDto, userId);
  }

  @Post('approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RISK_ASSESSOR)
  async approveLoan(@Body() approvalDto, @Body('loanId') loanId: string) {
    return this.loanService.approveLoan(approvalDto, loanId);
  }

  @Post('disburse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_ADMIN)
  async disburseLoan(@Body() disbursementDto, @Body('loanId') loanId: string) {
    return this.loanService.disburseLoan(disbursementDto, loanId);
  }
}
