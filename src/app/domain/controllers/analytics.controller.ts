import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { Role } from '../enums/roles.enum';
import { Roles } from '../middleware/role.decorator';
import { JwtAuthGuard } from 'src/app/auth/jwt.guard';
import { RolesGuard } from '../middleware/role.guard';
import { EmailVerifiedGuard } from 'src/app/auth/verified.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard, EmailVerifiedGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @Roles(Role.FINANCE_ADMIN, Role.ADMIN)
  async getReport() {
    return await this.analyticsService.generateReport();
  }
}
