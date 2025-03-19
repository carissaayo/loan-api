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
import { PaystackService } from '../domain/services/paystack.service';
import { EmailService } from '../domain/services/email.service';

import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UserModule,
  ],

  controllers: [LoanController],
  providers: [LoanService, PaystackService, EmailService],
  exports: [LoanService],
})
export class LoanModule {}
