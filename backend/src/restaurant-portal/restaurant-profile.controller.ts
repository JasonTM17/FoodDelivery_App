import { BadRequestException, Body, Controller, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { StorageService, UploadedFile as UploadedFileType } from '../storage/storage.service'
import { UpdateRestaurantProfileDto } from './restaurant-profile.dto'
import { RestaurantProfileService } from './restaurant-profile.service'

@ApiTags('restaurant-portal')
@ApiBearerAuth()
@Controller('restaurant/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.restaurant)
export class RestaurantProfileController {
  constructor(
    private readonly service: RestaurantProfileService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.service.get(user.sub)
  }

  @Patch()
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateRestaurantProfileDto) {
    return this.service.update(user.sub, dto)
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: UploadedFileType,
  ) {
    if (!file) throw new BadRequestException('PROFILE_IMAGE_REQUIRED')
    const { restaurantId } = await this.service.getMembership(user.sub)
    const { url } = await this.storage.uploadFile(file, `restaurants/${restaurantId}`)
    return { url }
  }
}
