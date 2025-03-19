import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EmailService } from './email.service';
import { LoanReminderService } from '../domain/services/reminder.service';
import { LoanCronService } from '../domain/services/loan-cron.service';

import { User, UserSchema } from '../user/user.schema';
import { Loan, LoanSchema } from '../loan/loan.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Loan.name, schema: LoanSchema },
    ]),
  ],

  controllers: [],
  providers: [EmailService, LoanReminderService, LoanCronService],
  exports: [EmailService, LoanReminderService, LoanCronService],
})
export class EmailModule {}
