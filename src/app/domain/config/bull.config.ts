import { Injectable } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BullConfigService {
  public readonly loanQueue: Queue;

  constructor(private readonly configService: ConfigService) {
    this.loanQueue = new Queue('loan-reminders', {
      connection: {
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: this.configService.get<number>('REDIS_PORT') || 6379,
      },
    });
  }
}
