import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DomainModule } from './app/domain/domain.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DomainModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
