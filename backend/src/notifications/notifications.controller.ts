import { Body, Controller, Delete, Get, Patch, Post, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { NotificationsService } from './notifications.service'
import {
  compatibleRegisterFcmTokenSchema,
  fcmTokenSchema,
  unregisterFcmTokenSchema,
  type CompatibleRegisterFcmTokenInput,
  type RegisterFcmTokenInput,
  type UnregisterFcmTokenInput,
} from './notifications.zod'

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
    @Body(new ZodValidationPipe(compatibleRegisterFcmTokenSchema))
    body: CompatibleRegisterFcmTokenInput,
  ) {
    if ('registrationId' in body) {
      return this.notificationsService.registerFcmToken(
        user.sub,
        body as RegisterFcmTokenInput,
      )
    }
    return this.notificationsService.registerLegacyFcmToken(user.sub, body)
  }

  @Delete('fcm-token')
  unregisterFcmToken(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(unregisterFcmTokenSchema)) body: UnregisterFcmTokenInput,
  ) {
    return this.notificationsService.unregisterFcmToken(user.sub, body)
  }

  @Delete('fcm-token/:token')
  unregisterLegacyFcmToken(
    @CurrentUser() user: JwtPayload,
    @Param('token', new ZodValidationPipe(fcmTokenSchema)) token: string,
  ) {
    return this.notificationsService.unregisterLegacyFcmToken(user.sub, token)
  }
}
