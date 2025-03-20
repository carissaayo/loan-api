import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';
import { Loan, LoanSchema } from './loan.schema';
import { User, UserSchema } from '../user/user.schema';

import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { PaystackModule } from '../paystack/paystack.module';
import { AnalyticsService } from '../analytic/analytics.service';
import { RedisService } from '../domain/services/redis.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UserModule,
    EmailModule,
    PaystackModule,
  ],

  controllers: [LoanController],
  providers: [LoanService, AnalyticsService, RedisService],
  exports: [LoanService],
})
export class LoanModule {}
