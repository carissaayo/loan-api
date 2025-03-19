import {
  Controller,
  Get,
  Param,
  Body,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';

import {
  AuthenticatedRequest,
  RolesGuard,
} from '../domain/middleware/role.guard';
import { Roles } from '../domain/middleware/role.decorator';
import { Role } from '../domain/enums/roles.enum';
import { UsersService } from './user.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/role')
  @Roles(Role.ADMIN)
  async changeUserRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') userId: string,
    @Body('newRole') newRole: Role,
  ) {
    return await this.usersService.assignRole(req.user, userId, newRole);
  }

  @Get()
  @Roles(Role.ADMIN)
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    return this.usersService.findUser(userId);
  }
}
