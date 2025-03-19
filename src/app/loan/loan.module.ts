import { Module, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';

import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';
import { Loan, LoanSchema } from './loan.schema';
import { User, UserSchema } from '../user/user.schema';
import { PaystackService } from '../paystack/paystack.service';
import { EmailService } from '../email/email.service';

import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { PaystackModule } from '../paystack/paystack.module';

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
  providers: [LoanService],
  exports: [LoanService],
})
export class LoanModule {}
