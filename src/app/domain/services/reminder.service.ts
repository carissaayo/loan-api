/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanDocument, LoanStatus } from '../schemas/loan.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Injectable()
export class LoanReminderService {
  private readonly queue: Queue;
  private readonly logger = new Logger(LoanReminderService.name);

  constructor(
    @InjectModel(Loan.name) private readonly loanModel: Model<LoanDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.queue = new Queue('loan-reminders', {
      connection: { host: 'localhost', port: 6379 },
    });

    // Start processing jobs
    this.startWorker();
  }

  async scheduleReminders() {
    const overdueLoans = await this.loanModel.find({
      dueDate: { $lte: new Date() },
      status: LoanStatus.DISBURSED, // Ensure we only process active loans
    });

    for (const loan of overdueLoans) {
      await this.queue.add('send-reminder', { loanId: loan._id });
    }

    this.logger.log(`Scheduled ${overdueLoans.length} loan reminders`);
  }

  private startWorker() {
    new Worker(
      'loan-reminders',
      async (job) => {
        const { loanId } = job.data;
        const loan = await this.loanModel.findById(loanId);
        if (!loan) return;

        const user = await this.userModel.findById(loan.userId);
        if (!user) return;

        const now = new Date();
        if (loan.dueDate < now) {
          // Increase ownedAmount by 30%
          const penalty = loan.totalAmount * 0.3;
          user.ownedAmount += penalty;
          loan.dueDate.setMinutes(loan.dueDate.getMinutes() + 30); // Move due date to next 30 minutes
          const message = `Dear ${user.name}, your loan payment is overdue and has been increased by 30%. Please pay ASAP to prevent further penalties.`;

          await this.emailService.sendEmail(
            user.email,
            'Loan Payment Overdue',
            message,
          );
          await user.save();
          await loan.save();

          this.logger.log(
            `Penalty applied to user ${user._id}. New due date: ${loan.dueDate}`,
          );
        }
      },
      {
        connection: {
          host: this.configService.get<string>('REDIS_HOST'),
          port: this.configService.get<number>('REDIS_PORT'),
        },
      },
    );
  }
}
