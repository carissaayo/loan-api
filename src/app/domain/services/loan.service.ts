import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanDocument } from '../schemas/loan.schema';

@Injectable()
export class LoansService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<LoanDocument>) {}

  async requestLoan(userId: string, amount: number, repaymentPeriod: number) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + repaymentPeriod);

    const loan = new this.loanModel({
      user: userId,
      amount,
      repayment_period: repaymentPeriod,
      status: 'Pending',
      remaining_balance: amount,
      due_date: dueDate,
    });

    return loan.save();
  }

  async approveLoan(loanId: string, approverId: string) {
    return this.loanModel.findByIdAndUpdate(
      loanId,
      { status: 'Approved', approved_by: approverId },
      { new: true },
    );
  }

  async disburseLoan(loanId: string, disburserId: string) {
    return this.loanModel.findByIdAndUpdate(
      loanId,
      { status: 'Disbursed', disbursed_by: disburserId },
      { new: true },
    );
  }
}
