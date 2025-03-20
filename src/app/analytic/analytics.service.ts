import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanDocument, LoanStatus } from '../loan/loan.schema';
import { User, UserDocument } from '../user/user.schema';
import { RedisService } from '../domain/services/redis.service';

@Injectable()
export class AnalyticsService {
  private readonly cacheTTL = 1800; // 30 minutes
  constructor(
    @InjectModel(Loan.name) private readonly loanModel: Model<LoanDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly redisService: RedisService,
  ) {}

  async getTotalLoansDisbursed(): Promise<number> {
    const cacheKey = 'analytics:totalLoansDisbursed';
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) return JSON.parse(cachedData);

    const totalLoans = await this.loanModel.countDocuments({
      status: LoanStatus.DISBURSED,
    });

    await this.redisService.set(
      cacheKey,
      JSON.stringify(totalLoans),
      this.cacheTTL,
    );
    return totalLoans;
  }

  async getTotalOutstandingBalances(): Promise<number> {
    const cacheKey = 'analytics:totalOutstandingBalances';
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) return JSON.parse(cachedData);

    const result = await this.userModel.aggregate([
      {
        $group: {
          _id: null,
          totalOutstanding: { $sum: { $abs: '$ownedAmount' } },
        },
      },
    ]);
    const totalOutstanding = result.length > 0 ? result[0].totalOutstanding : 0;

    await this.redisService.set(
      cacheKey,
      JSON.stringify(totalOutstanding),
      this.cacheTTL,
    );
    return totalOutstanding;
  }

  async getUsersWhoMissedPayments(): Promise<UserDocument[]> {
    const cacheKey = 'analytics:usersWhoMissedPayments';
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) return JSON.parse(cachedData);

    const overdueLoans = await this.loanModel.find({
      dueDate: { $lt: new Date() },
      status: LoanStatus.DISBURSED,
      isCompleted: false,
    });

    const userIds = overdueLoans.map((loan) => loan.userId);
    const users = await this.userModel.find({ _id: { $in: userIds } });

    await this.redisService.set(cacheKey, JSON.stringify(users), this.cacheTTL);
    return users;
  }

  async generateReport() {
    const cacheKey = 'analytics:report';
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) return JSON.parse(cachedData);

    const totalLoansDisbursed = await this.getTotalLoansDisbursed();
    const totalOutstandingBalances = await this.getTotalOutstandingBalances();
    const usersWhoMissedPayments = await this.getUsersWhoMissedPayments();

    const report = {
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

    await this.redisService.set(
      cacheKey,
      JSON.stringify(report),
      this.cacheTTL,
    );
    return report;
  }

  async clearAnalyticsCache() {
    try {
      await this.redisService.del('analytics:totalLoansDisbursed');
      await this.redisService.del('analytics:totalOutstandingBalances');
      await this.redisService.del('analytics:usersWhoMissedPayments');
      await this.redisService.del('analytics:report');
      return 'Analytics cache has been cleared';
    } catch (err) {
      console.log(err);
    }
  }
}
