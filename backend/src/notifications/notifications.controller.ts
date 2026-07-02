import { Body, Controller, Delete, Get, Patch, Post, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { NotificationsService } from './notifications.service'

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentUser() user: JwtPayload, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.notificationsService.getUserNotifications(user.sub, Number(page) || 1, Number(limit) || 20)
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.sub)
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.sub)
  }

  @Post('fcm-token')
  registerFcmToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: { token: string; platform: 'ios' | 'android' | 'web'; deviceId?: string },
  ) {
    return this.notificationsService.registerFcmToken(user.sub, body.token, body.platform, body.deviceId)
  }

  @Delete('fcm-token/:token')
  unregisterFcmToken(@CurrentUser() user: JwtPayload, @Param('token') token: string) {
    return this.notificationsService.unregisterFcmToken(user.sub, token)
  }
}
