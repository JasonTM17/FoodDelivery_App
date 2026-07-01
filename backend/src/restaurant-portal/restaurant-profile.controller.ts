import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { UpdateRestaurantProfileDto } from './restaurant-profile.dto'
import { RestaurantProfileService } from './restaurant-profile.service'

@ApiTags('restaurant-portal')
@ApiBearerAuth()
@Controller('restaurant/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.restaurant)
export class RestaurantProfileController {
  constructor(private readonly service: RestaurantProfileService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.service.get(user.sub)
  }

  @Patch()
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateRestaurantProfileDto) {
    return this.service.update(user.sub, dto)
  }
}
