import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UsersService } from './users.service'
import { CreateAddressDto, UpdateAddressDto, UpdateUserDto } from './users.dto'
import { JwtAuthGuard } from '@/auth/jwt-auth.guard'
import { CurrentUser } from '@/auth/current-user.decorator'
import { StorageService, UploadedFile as UploadedFileType } from '@/storage/storage.service'
import type { JwtPayload } from '@/auth/jwt-payload.interface'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storageService: StorageService,
  ) {}

  @Get('me')
  getProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub)
  }

  @Get('addresses')
  listAddresses(@CurrentUser() user: JwtPayload) {
    return this.usersService.listAddresses(user.sub)
  }

  @Post('addresses')
  createAddress(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(user.sub, dto)
  }

  @Put('addresses/:id')
  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateAddress(user.sub, id, dto)
  }

  @Delete('addresses/:id')
  deleteAddress(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.usersService.deleteAddress(user.sub, id)
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto)
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Only image files (jpeg, png, webp) are allowed'), false)
      }
      cb(null, true)
    },
  }))
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: UploadedFileType,
  ) {
    if (!file) {
      return { url: '' }
    }

    const { url } = await this.storageService.uploadAvatar(user.sub, file)
    return { url }
  }
}
