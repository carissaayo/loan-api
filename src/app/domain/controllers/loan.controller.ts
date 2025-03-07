import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';

import { JwtAuthGuard } from 'src/app/auth/jwt.guard';
import { AuthenticatedRequest, RolesGuard } from '../middleware/role.guard';
import { Roles } from '../middleware/role.decorator';
import { Role } from '../enums/roles.enum';
import { LoanService } from '../services/loan.service';
import { CreateLoanDto } from '../dto/loan.dto';

@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Roles(Role.USER)
  @Post('request-loan')
  @UseGuards(JwtAuthGuard)
  async requestLoan(@Req() req: AuthenticatedRequest, @Body() CreateLoanDto) {
    return this.loanService.requestLoan(CreateLoanDto, req.user);
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
