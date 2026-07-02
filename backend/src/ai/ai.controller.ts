import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AiChatRequest, AiChatService } from './ai-chat.service'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly chat: AiChatService) {}

  @Post('chat')
  chatOnce(
    @CurrentUser() user: JwtPayload,
    @Body() body: AiChatRequest,
  ) {
    return this.chat.createReply(body, user)
  }
}
