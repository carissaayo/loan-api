import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UsersController } from './user.controller';

import { UsersService } from './user.service';
import { RedisService } from '../domain/services/redis.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  controllers: [UsersController],
  providers: [UsersService, RedisService],
  exports: [UsersService],
})
export class UserModule {}
