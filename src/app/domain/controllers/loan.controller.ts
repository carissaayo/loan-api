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

@Controller('loans')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Roles(Role.USER)
  @Post('request-loan')
  @UseGuards(JwtAuthGuard)
  async requestLoan(@Req() req: AuthenticatedRequest, @Body() CreateLoanDto) {
    return this.loanService.requestLoan(CreateLoanDto, req.user);
  }

  @Get(':loanId/get')
  @UseGuards(JwtAuthGuard)
  async getSingleLoan(@Param('loanId') loanId: string) {
    if (!loanId) {
      throw new BadRequestException('Loan Id is required');
    }
    return this.loanService.getALoan(loanId);
  }

  @Patch(':loanId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RISK_ASSESSOR)
  async reviewLoan(
    @Param('loanId') loanId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.reviewLoan(loanId, req);
  }

  @Roles(Role.RISK_ASSESSOR)
  @Patch(':loanId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RISK_ASSESSOR)
  async approveLoan(
    @Param('loanId') loanId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.approveLoan(req, loanId);
  }

  @Roles(Role.RISK_ASSESSOR)
  @Patch(':loanId/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RISK_ASSESSOR)
  async rejectLoan(
    @Param('loanId') loanId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.rejectLoan(req, loanId);
  }

  @Patch(':loanId/disburse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FINANCE_ADMIN)
  async disburseLoan(
    @Param('loanId') loanId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.loanService.disburseLoan(loanId, req);
  }
}
