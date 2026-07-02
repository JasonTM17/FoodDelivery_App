import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import type { Response } from 'express'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AdminExportQueryDto, CreateAdminExportDto } from './admin-export.dto'
import { AdminExportService } from './admin-export.service'

@ApiTags('admin-exports')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminExportController {
  constructor(private readonly exports: AdminExportService) {}

  @Get('exports')
  list(@Query() query: AdminExportQueryDto) {
    return this.exports.list(query)
  }

  @Post('exports')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAdminExportDto) {
    return this.exports.create(user.sub, dto)
  }

  @Get('exports/:id/download')
  async download(@Param('id') id: string, @Res() response: Response) {
    const file = await this.exports.getDownload(id)
    response.setHeader('Content-Type', 'text/csv; charset=utf-8')
    response.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`)
    response.send(file.csv)
  }

  @Get('export-jobs')
  listLegacyExportJobs(@Query() query: AdminExportQueryDto) {
    return this.exports.list(query)
  }

  @Get('reports/jobs')
  listLegacyReportJobs(@Query() query: AdminExportQueryDto) {
    return this.exports.list(query)
  }

  @Post('reports/generate')
  createLegacyReport(@CurrentUser() user: JwtPayload, @Body() dto: CreateAdminExportDto) {
    return this.exports.create(user.sub, dto)
  }
}
