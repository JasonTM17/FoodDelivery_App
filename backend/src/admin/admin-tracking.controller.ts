import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AdminTrackingService } from './admin-tracking.service'

@ApiTags('admin-tracking')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminTrackingController {
  constructor(private readonly tracking: AdminTrackingService) {}

  @Get('online-drivers')
  async getOnlineDrivers() {
    return this.tracking.getOnlineDrivers()
  }
}
