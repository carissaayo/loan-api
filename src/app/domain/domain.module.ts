import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

import { JwtStrategy } from './middleware/jwt.strategy';
import { User, UserSchema } from '../user/user.schema';
import { JwtAuthGuard } from './middleware/jwt.guard';
import { RolesGuard } from './middleware/role.guard';
import { Loan, LoanSchema } from '../loan/loan.schema';

import { LoanModule } from '../loan/loan.module';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';
import { PaystackModule } from '../paystack/paystack.module';
import { AuthModule } from '../auth/auth.module';

import { EmailVerifiedGuard } from './middleware/verified.guard';
import { LoanReminderService } from './services/reminder.service';
import { LoanCronService } from './services/loan-cron.service';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        console.log(`Connected to MongoDB `);
        return { uri };
      },
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
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EmailVerifiedGuard,
    },
    JwtAuthGuard,
    EmailVerifiedGuard,
    JwtStrategy,
    LoanReminderService,
    LoanCronService,
    AnalyticsService,
  ],
  exports: [],
})
export class DomainModule {}
