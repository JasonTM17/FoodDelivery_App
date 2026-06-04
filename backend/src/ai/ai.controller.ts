import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  @Post('chat')
  async chat(
    @CurrentUser() user: JwtPayload,
    @Body() body: { message: string; sessionId?: string; orderId?: string },
  ) {
    return {
      reply: `Xin chào! Tôi là FoodFlow AI Assistant. Bạn cần giúp gì? (User: ${user.sub})`,
      action: 'answered',
    }
  }
}
