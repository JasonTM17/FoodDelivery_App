import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { AdminService } from './admin.service'

@Controller('admin')
@UseGuards(JwtAuthGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() { return this.adminService.getDashboard() }

  @Get('dashboard/top-restaurants')
  getTopRestaurants(@Query('days') days?: string) {
    return this.adminService.getTopRestaurants(Number(days) || 7)
  }

  @Get('dashboard/revenue-chart')
  getRevenueChart(@Query('days') days?: string) {
    return this.adminService.getRevenueChart(Number(days) || 7)
  }

  @Get('orders')
  getOrders(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getOrders({ status, page: Number(page), limit: Number(limit) })
  }

  @Get('users')
  getUsers(@Query('role') role?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getUsers({ role, page: Number(page), limit: Number(limit) })
  }

  @Patch('users/:id/status')
  toggleUserStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleUserStatus(id, body.isActive)
  }

  @Get('restaurants')
  getRestaurants(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getRestaurants({ page: Number(page), limit: Number(limit) })
  }

  @Patch('restaurants/:id/status')
  toggleRestaurantStatus(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleRestaurantStatus(id, body.isActive)
  }

  @Get('support-tickets')
  getSupportTickets(@Query('status') status?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getSupportTickets({ status, page: Number(page), limit: Number(limit) })
  }

  @Patch('support-tickets/:id')
  updateSupportTicket(@Param('id') id: string, @Body() body: { status?: string; assignedAdminId?: string; resolutionNotes?: string }) {
    return this.adminService.updateSupportTicket(id, body)
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminService.getAuditLogs({ page: Number(page), limit: Number(limit) })
  }

  @Get('promotions')
  async getPromotions() {
    // Return seed data for now — full CRUD via Prisma later
    return [
      { id: "1", code: "WELCOME20", type: "percentage", value: 20, minOrderAmount: 50000, maxDiscount: 50000, usageCount: 145, usageLimit: 1000, isActive: true, expiresAt: "2026-12-31" },
      { id: "2", code: "FREESHIP", type: "fixed", value: 15000, minOrderAmount: 100000, maxDiscount: 15000, usageCount: 89, usageLimit: 500, isActive: true, expiresAt: "2026-12-31" },
      { id: "3", code: "SUMMER50", type: "percentage", value: 50, minOrderAmount: 200000, maxDiscount: 100000, usageCount: 12, usageLimit: 200, isActive: true, expiresAt: "2026-12-31" },
    ]
  }
}
