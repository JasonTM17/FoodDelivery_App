import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { RealtimeTokenService, type RealtimeTokenRequest } from './realtime-token.service'

@ApiTags('realtime')
@ApiBearerAuth()
@Controller('realtime')
@UseGuards(JwtAuthGuard)
export class RealtimeTokenController {
  constructor(private readonly realtimeTokenService: RealtimeTokenService) {}

  @Post('token')
  issueToken(
    @CurrentUser() user: JwtPayload,
    @Body() body: RealtimeTokenRequest = {},
  ) {
    return this.realtimeTokenService.issueToken(user, body)
  }
}
