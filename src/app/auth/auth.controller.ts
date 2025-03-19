import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from '../domain/dto/auth.dto';

import { Public } from '../domain/middleware/public.decorator';
import { TermiiService } from '../domain/services/termii.service';
import { RolesGuard } from '../domain/middleware/role.guard';
import { Role } from '../domain/enums/roles.enum';
import { Roles } from '../domain/middleware/role.decorator';

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly termiiService: TermiiService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body()
    body: {
      email: string;
      password: string;
      confirmPassword: string;
      phone: string;
      name: string;
    },
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.confirmPassword,
      body.phone,
      body.name,
    );
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const token = await this.authService.login(loginDto);
    if (!token) throw new UnauthorizedException('Invalid credentials');
    return token;
  }
  @Post('sender-id/request')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async requestSenderId() {
    const response = await this.termiiService.requestForSenderId();
    return { message: 'request sent', response };
  }

  @Get('sender-id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async fetchSenderId() {
    const response = await this.termiiService.fetchSenderId();
    return { message: 'sender id fetched', response };
  }

  @Post('verify-phone')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async verifyPhone(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ) {
    const response = await this.termiiService.sendVerificationCode(
      phoneNumber,
      code,
    );
    return { message: 'request sent', response };
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return await this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    try {
      return await this.authService.resendVerificationEmail(email);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
