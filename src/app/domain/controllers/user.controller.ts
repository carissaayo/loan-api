import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from '../services/user.service';
import { JwtAuthGuard } from 'src/app/auth/jwt.guard';
import { AuthenticatedRequest, RolesGuard } from '../middleware/role.guard';
import { Roles } from '../middleware/role.decorator';
import { Role } from '../enums/roles.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async changeUserRole(
    @Req() req: AuthenticatedRequest,
    @Param('id') userId: string,
    @Body('newRole') newRole: Role,
  ) {
    return await this.usersService.assignRole(req.user, userId, newRole);
  }

  @Get()
  async getAllUsers() {
    // return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') userId: string) {
    // return this.usersService.getUserById(userId);
  }
}
