import { Controller, Get, Post, UseGuards } from '@nestjs/common';

import { EmailVerifiedGuard } from 'src/app/domain/middleware/verified.guard';
import { JwtAuthGuard } from '../domain/middleware/jwt.guard';
import { RolesGuard } from '../domain/middleware/role.guard';
import { AnalyticsService } from './analytics.service';
import { Role } from '../domain/enums/roles.enum';
import { Roles } from '../domain/middleware/role.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard, EmailVerifiedGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles(Role.FINANCE_ADMIN, Role.ADMIN)
  async getReport() {
    return await this.analyticsService.generateReport();
  }
  @Post('/clear-cache')
  @Roles(Role.FINANCE_ADMIN, Role.ADMIN)
  async clearAnalyticsCache() {
    return this.analyticsService.clearAnalyticsCache();
  }
}
