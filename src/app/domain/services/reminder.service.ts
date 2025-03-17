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
      connection: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
    });

    // Start processing jobs
    this.startWorker();
  }

  async scheduleReminders() {
    const overdueLoans = await this.loanModel.find({
      dueDate: { $lte: new Date() },
      status: LoanStatus.DISBURSED, // Ensure we only process active loans
      isCompleted: false,
    });

    for (const loan of overdueLoans) {
      await this.queue.add('send-reminder', { loanId: loan._id });
    }

    this.logger.log(`Scheduled ${overdueLoans.length} loan reminders`);
  }

  async scheduleUpcomingPaymentReminders() {
    // Find loans with due dates within the next 5 minutes
    const now = new Date();
    const nextDay = new Date();
    nextDay.setMinutes(now.getMinutes() + 5); // Set to 5 minutes ahead

    const upcomingLoans = await this.loanModel.find({
      dueDate: { $gte: now, $lte: nextDay },
      isCompleted: false,
      status: LoanStatus.DISBURSED,
    });

    for (const loan of upcomingLoans) {
      await this.queue.add('send-upcoming-reminder', { loanId: loan._id });
    }

    this.logger.log(
      `Scheduled ${upcomingLoans.length} upcoming loan reminders`,
    );
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
          loan.totalAmount += penalty;

          const message = `Dear ${user.name}, your loan payment is overdue and has been increased by 30%. Please pay ASAP to prevent further penalties.`;

          await this.emailService.sendEmail(
            user.email,
            'Loan Payment Overdue',
            message,
          );
          await user.save();
          await loan.save();
          console.log(``);

          this.logger.log(`Penalty applied to user ${user._id}.`);
        }
      },
      {
        connection: {
          host: this.configService.get<string>('REDIS_HOST'),
          port: this.configService.get<number>('REDIS_PORT'),
        },
      },
    );
    new Worker(
      'loan-reminders',
      async (job) => {
        if (job.name === 'send-upcoming-reminder') {
          const { loanId } = job.data;
          const loan = await this.loanModel.findById(loanId);
          if (!loan) return;

          const user = await this.userModel.findById(loan.userId);
          if (!user) return;

          const message = `Dear ${user.name}, your loan payment is due soon on ${loan.dueDate.toDateString()}. Please make a payment to avoid penalties.`;

          await this.emailService.sendEmail(
            user.email,
            'Upcoming Loan Payment Reminder',
            message,
          );

          this.logger.log(`Upcoming payment reminder sent to user ${user._id}`);
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
