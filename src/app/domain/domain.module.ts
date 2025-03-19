import { Module, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as fs from 'fs';
import * as path from 'path';

import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from '../auth/jwt.strategy';

import { User, UserSchema } from '../user/user.schema';
import { JwtAuthGuard } from '../auth/jwt.guard';

import { RolesGuard } from './middleware/role.guard';
import { UsersController } from '../user/user.controller';
import { LoanService } from '../loan/loan.service';
import { LoanController } from '../loan/loan.controller';
import { Loan, LoanSchema } from '../loan/loan.schema';
import { PaystackService } from '../paystack/paystack.service';
import { PaystackController } from '../paystack/paystack.controller';
import { EmailVerifiedGuard } from '../auth/verified.guard';
import { LoanReminderService } from './services/reminder.service';
import { LoanCronService } from './services/loan-cron.service';
import { EmailService } from '../email/email.service';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsController } from './controllers/analytics.controller';
import { TermiiService } from './services/termii.service';
import { LoanModule } from '../loan/loan.module';
import { UserModule } from '../user/user.module';
import { EmailModule } from '../email/email.module';

export const ALL_SERVICES = fs
  .readdirSync(path.join(path.dirname(__filename), 'services'))
  .filter(
    (file) =>
      (path.extname(file) === '.js' || path.extname(file) === '.ts') &&
      !file.endsWith('.d.ts'),
  )
  .filter((file) => file.indexOf('.spec') === -1)
  .map((file) => require(`./services/${file}`).default as Type<any>);

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
  ],

  controllers: [AuthController, PaystackController, AnalyticsController],
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
    AuthService,
    PaystackService,
    LoanReminderService,
    LoanCronService,
    EmailService,
    AnalyticsService,
    TermiiService,
  ],
  exports: [
    PaystackService,
    LoanReminderService,
    LoanCronService,
    EmailService,
  ],
})
export class DomainModule {}
