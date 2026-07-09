import { BadRequestException, Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
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

const insightSections = ['suggestions', 'peak-hours', 'best-sellers', 'slow-movers', 'forecast'] as const
type InsightSection = (typeof insightSections)[number]

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
    if (!isInsightSection(section)) {
      throw new BadRequestException({
        code: 'UNKNOWN_RESTAURANT_ANALYTICS_SECTION',
        message: `Unknown restaurant analytics section: ${section}`,
        allowedSections: insightSections,
      })
    }

    const data = await this.insights.getInsights(user.sub)
    const sections: Record<InsightSection, unknown> = {
      suggestions: data.suggestions,
      'peak-hours': data.peakHours,
      'best-sellers': data.bestSellers,
      'slow-movers': data.slowMovers,
      forecast: data.forecast,
    }
    return sections[section]
  }

  @Get('insights/best-sellers')
  async getBestSellers(@CurrentUser() user: JwtPayload) {
    return (await this.insights.getInsights(user.sub)).bestSellers
  }
}

function isInsightSection(section: string): section is InsightSection {
  return (insightSections as readonly string[]).includes(section)
}
