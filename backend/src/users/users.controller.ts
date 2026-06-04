import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { UpdateUserDto } from './users.dto'
import { JwtAuthGuard } from '@/auth/jwt-auth.guard'
import { CurrentUser } from '@/auth/current-user.decorator'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.getProfile(user.id)
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, dto)
  }

  @Post('me/avatar')
  uploadAvatar(@CurrentUser() user: { id: string }) {
    // Placeholder -- file upload via S3/MinIO to be implemented
    return { url: `https://cdn.foodflow.dev/avatars/${user.id}.jpg` }
  }
}
