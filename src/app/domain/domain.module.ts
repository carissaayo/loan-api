import { Module, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import * as fs from 'fs';
import * as path from 'path';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from '../auth/jwt.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './services/user.service';
import { User, UserSchema } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { FirebaseService } from './services/firebase.service';
import { TwilioService } from './services/twillio.service';
import { Twilio } from 'twilio';

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
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  controllers: [AuthController],
  providers: [
    UsersService,
    JwtStrategy,
    JwtAuthGuard,
    AuthService,
    FirebaseService,
    {
      provide: 'TWILIO_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Twilio(
          configService.get<string>('TWILIO_ACCOUNT_SID'),
          configService.get<string>('TWILIO_AUTH_TOKEN'),
        );
      },
      inject: [ConfigService],
    },
    TwilioService,
  ],
  exports: [UsersService, TwilioService],
})
export class DomainModule {}
