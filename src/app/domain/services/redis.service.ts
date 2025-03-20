import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private readonly client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await this.client.set(key, JSON.stringify(value));
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
