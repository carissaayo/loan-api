import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanDocument, LoanStatus } from '../schemas/loan.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Loan.name) private readonly loanModel: Model<LoanDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getTotalLoansDisbursed(): Promise<number> {
    return await this.loanModel.countDocuments({
      status: LoanStatus.DISBURSED,
    });
  }

  async getTotalOutstandingBalances(): Promise<number> {
    const result = await this.userModel.aggregate([
      {
        $group: {
          _id: null,

          totalOutstanding: { $sum: { $abs: '$ownedAmount' } },
        },
      },
    ]);
    return result.length > 0 ? result[0].totalOutstanding : 0;
  }

  async getUsersWhoMissedPayments(): Promise<UserDocument[]> {
    const overdueLoans = await this.loanModel.find({
      dueDate: { $lt: new Date() }, // Loans past their due date
      status: LoanStatus.DISBURSED,
      isCompleted: false,
    });

    const userIds = overdueLoans.map((loan) => loan.userId);
    return this.userModel.find({ _id: { $in: userIds } });
  }

  async generateReport() {
    const totalLoansDisbursed = await this.getTotalLoansDisbursed();
    const totalOutstandingBalances = await this.getTotalOutstandingBalances();
    const usersWhoMissedPayments = await this.getUsersWhoMissedPayments();

    return {
      totalLoansDisbursed,
      totalOutstandingBalances,
      usersWhoMissedPayments: usersWhoMissedPayments.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        ownedAmount: user.ownedAmount,
      })),
    };
  }
}
