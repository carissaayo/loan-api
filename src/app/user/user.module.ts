import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UsersController } from './user.controller';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UsersService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  controllers: [UsersController],
  providers: [JwtAuthGuard, UsersService],
  exports: [UsersService],
})
export class UserModule {}
