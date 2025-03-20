import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EmailService } from './email.service';
import { LoanReminderService } from '../domain/services/reminder.service';
import { LoanCronService } from '../domain/services/loan-cron.service';

import { User, UserSchema } from '../user/user.schema';
import { Loan, LoanSchema } from '../loan/loan.schema';
import { RedisService } from '../domain/services/redis.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Loan.name, schema: LoanSchema },
    ]),
    UserModule,
  ],

  controllers: [],
  providers: [EmailService, LoanReminderService, LoanCronService, RedisService],
  exports: [EmailService, LoanReminderService, LoanCronService],
})
export class EmailModule {}
