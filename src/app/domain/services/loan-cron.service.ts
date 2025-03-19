import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoanReminderService } from './reminder.service';

@Injectable()
export class LoanCronService {
  constructor(private readonly loanReminderService: LoanReminderService) {}

  // @Cron('0/5 * * * *') // Runs every 5 minutes
  @Cron('0 6 * * *') // Runs every day at 6
  async handleDueReminders() {
    await this.loanReminderService.scheduleReminders();
  }

  // @Cron('0/10 * * * *') // Runs every 10 minutes
  @Cron('0 6 * * *') // Runs every day at 6
  async handleLoanReminders() {
    await this.loanReminderService.scheduleUpcomingPaymentReminders();
  }
}
