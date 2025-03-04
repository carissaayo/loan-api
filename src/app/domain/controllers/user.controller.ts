import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { UsersService } from '../services/user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers() {
    // return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    // return this.usersService.getUserById(userId);
  }

  @Post('register')
  async registerUser(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      role?: string;
    },
  ) {
    // return this.usersService.createUser(body);
  }
}
