import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanDocument, LoanStatus } from '../schemas/loan.schema';
import { CreateLoanDto, DisburseLoanDto, RepaymentDto } from '../dto/loan.dto';

@Injectable()
export class LoanService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<LoanDocument>) {}

  async requestLoan(createLoanDto: CreateLoanDto, req: any): Promise<any> {
    if (!req.userId) {
      throw new BadRequestException('userId is required');
    }
    const requestDate = new Date();

    const loan = new this.loanModel({
      ...createLoanDto,
      userId: req.userId,
      status: LoanStatus.PENDING,
      requestDate,
    });

    loan.save();
    return { message: 'Loan request has been made', loan };
  }
  async getALoan(loanId: string): Promise<any> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');

    return { message: 'Loan  has been fetched', loan };
  }
  async reviewLoan(loanId: string, req: any): Promise<any> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.PENDING) {
      throw new BadRequestException('Loan cannot be reviewed at this stage');
    }
    loan.status = LoanStatus.IN_REVIEW;
    loan.reviewedBy = req.user.userId;
    loan.reviewedDate = new Date();

    loan.save();
    return { message: 'Loan is being reviewed', loan };
  }

  async approveLoan(req: any, loanId: string): Promise<any> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (
      loan.status !== LoanStatus.IN_REVIEW &&
      loan.status !== LoanStatus.REJECTED
    ) {
      throw new BadRequestException('Loan cannot be approved at this stage');
    }
    loan.status = LoanStatus.APPROVED;
    loan.approvedBy = req.user.userId;
    loan.approvalDate = new Date();
    loan.rejectedBy = undefined;
    loan.rejectionDate = undefined;
    loan.save();
    return { message: 'Loan has been approved', loan };
  }

  async rejectLoan(req: any, loanId: string): Promise<any> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (
      loan.status !== LoanStatus.IN_REVIEW &&
      loan.status !== LoanStatus.APPROVED
    ) {
      throw new BadRequestException('Loan cannot be rejected at this stage');
    }
    loan.status = LoanStatus.REJECTED;
    loan.rejectedBy = req.user.userId;
    loan.rejectionDate = new Date();
    loan.approvedBy = undefined;
    loan.approvalDate = undefined;

    loan.save();
    return { message: 'Loan has been rejected', loan };
  }
  async disburseLoan(loanId: string, req: any): Promise<any> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');
    if (loan.status !== LoanStatus.APPROVED) {
      throw new BadRequestException('Loan is not approved for disbursement');
    }
    loan.status = LoanStatus.DISBURSED;
    loan.disbursementDate = new Date();
    loan.disbursedBy = req.user.userId;
    loan.save();
    return { message: 'Funds has been disbursed for this loan', loan };
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
