import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { LoanReminderService } from './reminder.service';

@Injectable()
export class LoanCronService {
  constructor(private readonly loanReminderService: LoanReminderService) {}

  @Cron('0/10 * * * *') // Runs every 30 minutes
  async handleLoanReminders() {
    await this.loanReminderService.scheduleReminders();
  }
}
