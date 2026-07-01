import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { RestaurantDashboardService } from './restaurant-dashboard.service'
import { RestaurantInsightsService } from './restaurant-insights.service'
import { RestaurantRevenueService } from './restaurant-revenue.service'

@ApiTags('restaurant-analytics')
@ApiBearerAuth()
@Controller('restaurant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.restaurant)
export class RestaurantAnalyticsController {
  constructor(
    private readonly dashboard: RestaurantDashboardService,
    private readonly revenue: RestaurantRevenueService,
    private readonly insights: RestaurantInsightsService,
  ) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtPayload, @Query('days') days = '7') {
    return this.dashboard.get(user.sub, Number(days))
  }

  @Get('revenue/summary')
  getRevenueSummary(@CurrentUser() user: JwtPayload, @Query('days') days = '7') {
    return this.revenue.getSummary(user.sub, Number(days))
  }

  @Get('revenue/benchmark')
  getBenchmark(@CurrentUser() user: JwtPayload) {
    return this.insights.getBenchmark(user.sub)
  }

  @Get('revenue/breakdown')
  getBreakdown(
    @CurrentUser() user: JwtPayload,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.revenue.getBreakdown(user.sub, startDate, endDate)
  }

  @Get('insights')
  getInsights(@CurrentUser() user: JwtPayload) {
    return this.insights.getInsights(user.sub)
  }

  @Get('analytics/:section')
  async getInsightSection(@CurrentUser() user: JwtPayload, @Param('section') section: string) {
    const data = await this.insights.getInsights(user.sub)
    const sections: Record<string, unknown> = {
      suggestions: data.suggestions,
      'peak-hours': data.peakHours,
      'best-sellers': data.bestSellers,
      'slow-movers': data.slowMovers,
      forecast: data.forecast,
    }
    return sections[section] ?? []
  }

  @Get('insights/best-sellers')
  async getBestSellers(@CurrentUser() user: JwtPayload) {
    return (await this.insights.getInsights(user.sub)).bestSellers
  }
}
