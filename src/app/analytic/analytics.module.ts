import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../user/user.schema';
import { Loan, LoanSchema } from '../loan/loan.schema';
import { LoanModule } from '../loan/loan.module';
import { UserModule } from '../user/user.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RedisService } from '../domain/services/redis.service';

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
  ],

  controllers: [AnalyticsController],
  providers: [AnalyticsService, RedisService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
