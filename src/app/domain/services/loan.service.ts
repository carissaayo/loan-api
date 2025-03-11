import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Loan, LoanDocument, LoanStatus } from '../schemas/loan.schema';
import { CreateLoanDto, DisburseLoanDto, RepaymentDto } from '../dto/loan.dto';
import { User, UserDocument } from '../schemas/user.schema';
import { UsersService } from './user.service';
import { PaystackService } from './paystack.service';

@Injectable()
export class LoanService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly userService: UsersService,
    private paystackService: PaystackService,
  ) {}

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
    await loan.save();
    const user = await this.userService.findUser(req.userId);
    const doesAccountNumberMatches = user.banks.filter(
      (bank) => bank.account_number === loan.account_number,
    );
    if (!doesAccountNumberMatches[0]) {
      throw new NotFoundException('Account number is not registered');
    }

    if (user) {
      const loanId = new Types.ObjectId(loan._id as string);
      user.loans.push(loanId);
      await user.save();
    }

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
    if (loan.status === LoanStatus.DISBURSED) {
      throw new BadRequestException('Loan has been disbursed already');
    }
    if (loan.status !== LoanStatus.APPROVED) {
      throw new BadRequestException('Loan is not approved for disbursement');
    }
    const user = await this.userModel.findById(loan.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    loan.status = LoanStatus.DISBURSED;
    loan.disbursementDate = new Date();
    loan.disbursedBy = req.user.userId;
    const recipient = user.banks.filter(
      (bank) => bank.account_number === loan.account_number,
    )[0]?.recipient_code;

    const amount = loan.amount;
    const transferFund = await this.paystackService.initiateTransfer(
      amount,
      recipient,
      'loan has been disbursed',
    );

    if (transferFund.data.status === 'success') {
      user.loanBalance += amount;
      user.ownedAmount += loan.totalAmount;
    }

    await loan.save();
    await user.save();

    return { message: 'Funds has been disbursed for this loan', user };
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
