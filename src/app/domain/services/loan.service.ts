import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Loan, LoanDocument, LoanStatus } from '../schemas/loan.schema';

import { User, UserDocument } from '../schemas/user.schema';
import { PaystackService } from './paystack.service';
import { EmailService } from './email.service';

@Injectable()
export class LoanService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private paystackService: PaystackService,
    private emailService: EmailService,
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
    const dueDate = new Date(requestDate);
    dueDate.setMonth(dueDate.getMonth() + 1);

    const loan = new this.loanModel({
      account_number,
      amount,
      repaymentPeriod,
      totalAmount,
      paymentMethod: paymentMethod && paymentMethod,
      userId: req.userId,
      status: LoanStatus.PENDING,
      requestDate,
      dueDate,
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
    const message = `A loan  of ${totalAmount} has been requested by you. In case you didn't make the request, kindly reach out to our customer service to get it rejected`;
    const title = `A loan request of ${totalAmount} has been made by you`;

    await this.emailService.sendEmail(user.email, title, message);

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
    const user = await this.userModel.findById(loan.userId);
    if (!user) throw new NotFoundException('User not found');
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

    const title = `Your loan has been approved`;
    const message = `Congratulations, your loan request has been approved. The fund will soon be disbursed into your account`;

    await this.emailService.sendEmail(user.email, title, message);
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
    const user = await this.userModel.findById(loan.userId);
    if (!user) throw new NotFoundException('User not found');
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

    const title = `Your loan request has been rejected`;
    const message = `I'm sorry to inform you that your loan request has been rejected. Reach out to  our customer service to find out more or you can apply for a new loan `;

    await this.emailService.sendEmail(user.email, title, message);

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
    const dueDate = new Date(loan.disbursementDate);
    dueDate.setMinutes(dueDate.getMinutes() + 30);
    loan.dueDate = dueDate;
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

    const title = `Congrats, funds has been disbursed for your loan`;
    const message = `I'm happy to inform you that your account has been credited. Try to make payment before the due date, to avoid further penalties`;

    await this.emailService.sendEmail(user.email, title, message);
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
    const title = `Your payment has been initiated`;
    const message = `Try and complete your payment, so it can be confirmed.
      \n\nHere is the url ${response.data.authorization_url}
      `;

    await this.emailService.sendEmail(user.email, title, message);
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
      user.ownedAmount -= amount;
      loan.amountPaid += amount;
      loan.remainingBalance -= amount;
      const paymentDate = new Date();
      const newPayment = { amount, reference: loan.reference, paymentDate };
      loan.payments.push(newPayment);
      loan.reference = undefined;

      // set new Due Date
      if (loan.totalAmount > loan.amountPaid) {
        const currentDueDate = loan.dueDate || new Date(); // Ensure dueDate is set
        const nextDueDate = new Date(currentDueDate);
        nextDueDate.setMinutes(nextDueDate.getMinutes() + 10);
        loan.dueDate = nextDueDate;
      }

      // if loan has been completed
      if (loan.totalAmount <= loan.amountPaid) {
        loan.status = LoanStatus.PAID;
      }
    }
    await user.save();
    await loan.save();
    const title = `Your payment has been confirmed`;
    const message = `A payment of #${amount} has been made. Your new owned balance is now ${loan.remainingBalance}`;

    await this.emailService.sendEmail(user.email, title, message);

    return {
      message: 'Payment has been confirmed',
      response,
    };
  }
}
