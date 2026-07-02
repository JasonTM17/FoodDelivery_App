import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { AdminSettingsPatchDto, AdminSettingsValue } from './admin-settings.dto'
import { AdminSettingsService } from './admin-settings.service'

@ApiTags('admin-settings')
@ApiBearerAuth()
@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.admin)
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get()
  getAll() {
    return this.settings.getAll()
  }

  @Patch()
  updateAll(@CurrentUser() user: JwtPayload, @Body() dto: AdminSettingsPatchDto) {
    return this.settings.updateMany(dto, user.sub)
  }

  @Get(':section')
  getSection(@Param('section') section: string) {
    return this.settings.getSection(section)
  }

  @Patch(':section')
  updateSection(
    @CurrentUser() user: JwtPayload,
    @Param('section') section: string,
    @Body() dto: AdminSettingsValue,
  ) {
    return this.settings.updateSection(section, dto, user.sub)
  }
}
