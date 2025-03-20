import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { EmailService } from './email.service';
import { LoanReminderService } from './reminder.service';

import { User, UserSchema } from '../user/user.schema';
import { Loan, LoanSchema } from '../loan/loan.schema';
import { RedisService } from '../domain/services/redis.service';
import { UserModule } from '../user/user.module';
import { AnalyticsService } from '../analytic/analytics.service';
import { LoanCronService } from './loan-cron.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Loan.name, schema: LoanSchema },
    ]),
    UserModule,
  ],

  controllers: [],
  providers: [
    EmailService,
    LoanReminderService,
    LoanCronService,
    RedisService,
    AnalyticsService,
  ],
  exports: [EmailService, LoanReminderService, LoanCronService],
})
export class EmailModule {}
