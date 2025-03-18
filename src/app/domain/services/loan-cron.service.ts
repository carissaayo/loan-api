import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LoanReminderService } from './reminder.service';

@Injectable()
export class LoanCronService {
  constructor(private readonly loanReminderService: LoanReminderService) {}

  @Cron('0/5 * * * *') // Runs every 10 minutes
  async handleDueReminders() {
    await this.loanReminderService.scheduleReminders();
  }

  @Cron('0/10 * * * *') // Runs every 2 minutes
  async handleLoanReminders() {
    await this.loanReminderService.scheduleUpcomingPaymentReminders();
  }
}
