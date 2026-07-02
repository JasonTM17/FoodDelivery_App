import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AdminAiMonitorService } from './admin-ai-monitor.service'

@ApiTags('admin-ai-monitor')
@ApiBearerAuth()
@Controller('admin/ai-monitor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminAiMonitorController {
  constructor(private readonly monitor: AdminAiMonitorService) {}

  @Get()
  overview() {
    return this.monitor.getOverview()
  }

  @Get('runs/:runId')
  run(@Param('runId') runId: string) {
    return this.monitor.getRun(runId)
  }
}
