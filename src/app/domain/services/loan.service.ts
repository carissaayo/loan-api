import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Loan, LoanDocument, LoanStatus } from '../schemas/loan.schema';
import { RepaymentDto } from '../dto/loan.dto';
import { User, UserDocument } from '../schemas/user.schema';
import { PaystackService } from './paystack.service';

@Injectable()
export class LoanService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private paystackService: PaystackService,
  ) {}

  async requestLoan(
    account_number: string,
    amount: number,
    repaymentPeriod: number,
    totalAmount: number,
    paymentMethod: string,
    req: any,
  ): Promise<any> {
    if (
      !account_number ||
      !amount ||
      !repaymentPeriod ||
      !totalAmount ||
      !req
    ) {
      throw new BadRequestException('Please provide all the requireds');
    }
    if (!req.userId) {
      throw new BadRequestException('userId is required');
    }
    const requestDate = new Date();
    const user = await this.userModel.findById(req.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.ownedAmount > 0) {
      throw new ForbiddenException(
        'You need to complete the existing loan payment',
      );
    }

    const loan = new this.loanModel({
      account_number,
      amount,
      repaymentPeriod,
      totalAmount,
      paymentMethod: paymentMethod && paymentMethod,
      userId: req.userId,
      status: LoanStatus.PENDING,
      requestDate,
    });

    const doesAccountNumberMatches = user.banks.filter(
      (bank) => bank.account_number === loan.account_number,
    );
    if (!doesAccountNumberMatches[0]) {
      throw new NotFoundException('Account number is not registered');
    }

    const loanId = new Types.ObjectId(loan._id as string);
    user.loans.push(loanId);
    await loan.save();

    await user.save();

    return { message: 'Loan request has been made', loan };
  }
  async getALoan(loanId: string): Promise<any> {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');

    return { message: 'Loan  has been fetched', loan };
  }
  async getAllLoans(): Promise<any> {
    const loans = await this.loanModel.find();
    if (!loans) throw new NotFoundException('loans not found');

    return { message: 'Loans  has been fetched', loans };
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

  async rejectLoan(
    req: any,
    loanId: string,
    rejectionReason: string,
  ): Promise<any> {
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
    loan.rejectionReason = rejectionReason;

    await loan.save();
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
      user.ownedAmount += loan.totalAmount;
    }

    await loan.save();
    await user.save();

    return { message: 'Funds has been disbursed for this loan', user };
  }

  async startRepayment(loanId: string, req: any, amount: number) {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.status === LoanStatus.PAID) {
      throw new NotFoundException('this loan repayment is complete');
    }

    if (loan.userId !== req.user.userId) {
      throw new NotFoundException('You can only repay your loan');
    }
    const user = await this.userModel.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const response = await this.paystackService.initiateRepayment(
      user.email,
      amount,
    );
    loan.reference = response.data.reference;
    await loan.save();
    return {
      message: 'Payment link generated',
      response,
    };
  }

  async verifyRepayment(loanId: string, req: any) {
    const loan = await this.loanModel.findById(loanId);
    if (!loan) throw new NotFoundException('Loan not found');

    if (loan.status === LoanStatus.PAID) {
      throw new NotFoundException('this loan repayment is complete');
    }
    if (loan.userId !== req.user.userId) {
      throw new NotFoundException('You can only repay your loan');
    }
    const user = await this.userModel.findById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (loan.reference === undefined) {
      throw new ForbiddenException(
        'payment needs to be made so the reference will be available',
      );
    }

    const response = await this.paystackService.verifyRepayment(loan.reference);
    const amount = response.data.amount / 100;
    if (response.data.status === 'abandoned') {
      throw new UnauthorizedException("You haven't completed the payment");
    }
    if (response.data.status === 'success') {
      // Math.max(user.ownedAmount - amount, 0);
      user.ownedAmount -= amount;
      loan.amountPaid += amount;
      loan.remainingBalance -= amount;
      const newPayment = { amount, reference: loan.reference };
      loan.payments.push(newPayment);
      loan.reference = undefined;
      if (loan.totalAmount <= loan.amountPaid) {
        loan.status = LoanStatus.PAID;
        // const formattedLoanId= new Types.ObjectId(loanId)
      }
    }
    await user.save();
    await loan.save();

    return {
      message: 'Payment has been confirmed',
      response,
    };
  }
}
