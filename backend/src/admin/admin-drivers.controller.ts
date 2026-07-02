import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AdminDriversQueryDto } from './admin-drivers.dto'
import { AdminDriversService } from './admin-drivers.service'

@ApiTags('admin-drivers')
@ApiBearerAuth()
@Controller('admin/drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminDriversController {
  constructor(private readonly drivers: AdminDriversService) {}

  @Get()
  list(@Query() query: AdminDriversQueryDto) {
    return this.drivers.list(query)
  }
}
