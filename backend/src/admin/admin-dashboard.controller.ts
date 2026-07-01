import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AdminDashboardService } from './admin-dashboard.service'

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get('kpis')
  getKpis(@Query('period') period = 'today') { return this.dashboard.getKpis(period) }

  @Get('charts')
  getCharts(@Query('period') period = '30d') { return this.dashboard.getCharts(period) }

  @Get('dashboard/heatmap')
  getHeatmap(@Query('days') days = '30') {
    return this.dashboard.getOrderHeatmap(new Date(Date.now() - Number(days) * 86_400_000))
  }

  @Get('orders/recent')
  getRecentOrders(@Query('limit') limit = '20') { return this.dashboard.getRecentOrders(Number(limit)) }
}
