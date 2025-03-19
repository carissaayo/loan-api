import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';

import { LoanModule } from '../loan/loan.module';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { PaystackModule } from '../paystack/paystack.module';
import { AuthModule } from '../auth/auth.module';

import { LoanReminderService } from './services/reminder.service';
import { LoanCronService } from './services/loan-cron.service';
import { AnalyticsService } from './services/analytics.service';

import { User, UserSchema } from '../user/user.schema';
import { Loan, LoanSchema } from '../loan/loan.schema';

import { AnalyticsController } from './controllers/analytics.controller';

import { EmailVerifiedGuard } from './middleware/verified.guard';
import { JwtStrategy } from './middleware/jwt.strategy';
import { JwtAuthGuard } from './middleware/jwt.guard';
import { RolesGuard } from './middleware/role.guard';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Loan.name, schema: LoanSchema },
    ]),
    ScheduleModule.forRoot(),
    LoanModule,
    UserModule,
    EmailModule,
    PaystackModule,
    AuthModule,
  ],

  controllers: [AnalyticsController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: EmailVerifiedGuard,
    },
    JwtStrategy,
    LoanReminderService,
    LoanCronService,
    AnalyticsService,
    RolesGuard,
    EmailVerifiedGuard,
  ],
  exports: [LoanReminderService, JwtStrategy, AnalyticsService],
})
export class DomainModule {}
