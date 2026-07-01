import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CreateShiftDto, InviteStaffDto, UpdateShiftDto, UpdateStaffDto } from './restaurant-staff.dto'
import { RestaurantStaffService } from './restaurant-staff.service'

@ApiTags('restaurant-staff')
@ApiBearerAuth()
@Controller('restaurant/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.restaurant)
export class RestaurantStaffController {
  constructor(private readonly service: RestaurantStaffService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) { return this.service.list(user.sub) }

  @Post('invite')
  invite(@CurrentUser() user: JwtPayload, @Body() dto: InviteStaffDto) {
    return this.service.invite(user.sub, dto)
  }

  @Patch(':id')
  update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    return this.service.update(user.sub, id, dto)
  }

  @Post('shifts')
  createShift(@CurrentUser() user: JwtPayload, @Body() dto: CreateShiftDto) {
    return this.service.createShift(user.sub, dto)
  }

  @Patch('shifts/:id')
  updateShift(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.service.updateShift(user.sub, id, dto)
  }

  @Delete('shifts/:id')
  deleteShift(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteShift(user.sub, id)
  }
}
