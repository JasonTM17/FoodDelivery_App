import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import type { Response } from 'express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AdminAuditQueryDto } from './admin-audit.dto'
import { AdminAuditService } from './admin-audit.service'

@ApiTags('admin-audit')
@ApiBearerAuth()
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminAuditController {
  constructor(private readonly audit: AdminAuditService) {}

  @Get()
  list(@Query() query: AdminAuditQueryDto) {
    return this.audit.list(query)
  }

  @Get('export')
  async exportCsv(@Query() query: AdminAuditQueryDto, @Res() response: Response) {
    const csv = await this.audit.exportCsv(query)
    const filename = `foodflow-audit-${new Date().toISOString().slice(0, 10)}.csv`
    response.setHeader('Content-Type', 'text/csv; charset=utf-8')
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    response.send(csv)
  }
}
