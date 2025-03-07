import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanStatus } from '../schemas/loan.schema';
import {
  ApproveLoanDto,
  CreateLoanDto,
  DisburseLoanDto,
  RepaymentDto,
} from '../dto/loan.dto';

@Injectable()
export class LoanService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<Loan>) {}

  async requestLoan(createLoanDto: CreateLoanDto, req: any): Promise<any> {
    console.log(req.user);

    const loan = new this.loanModel({
      ...createLoanDto,
      user: req.user,
      status: LoanStatus.PENDING,
    });

    loan.save();
    return { message: 'Loan request has been made', loan };
  }

  async approveLoan(
    approveLoanDto: ApproveLoanDto,
    loanId: string,
  ): Promise<Loan> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException('Loan cannot be approved at this stage');
    }
    loan.status = LoanStatus.IN_REVIEW;
    return loan.save();
  }

  async disburseLoan(
    disburseLoanDto: DisburseLoanDto,
    loanId: string,
  ): Promise<Loan> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.APPROVED) {
      throw new BadRequestException('Loan is not approved for disbursement');
    }
    loan.status = LoanStatus.DISBURSED;
    loan.disbursementDate = new Date();
    return loan.save();
  }

  async makeRepayment(
    repaymentDto: RepaymentDto,
    loanId: string,
  ): Promise<Loan> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.DISBURSED) {
      throw new BadRequestException('Loan is not disbursed yet');
    }
    loan.amountPaid += repaymentDto.amount;
    if (loan.amountPaid >= loan.totalAmount) {
      loan.status = LoanStatus.PAID;
    }
    return loan.save();
  }
}
