import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtPayload } from '../auth/jwt-payload.interface'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AiChatRequestDto } from './ai-chat.dto'
import { AiChatService } from './ai-chat.service'

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly chat: AiChatService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Create an authenticated DeepSeek chat reply' })
  @ApiBody({ type: AiChatRequestDto })
  @ApiOkResponse({ description: 'Safety-filtered provider reply with real grounding metadata.' })
  @ApiServiceUnavailableResponse({ description: 'AI provider is unconfigured, unavailable, or context cannot be verified.' })
  chatOnce(
    @CurrentUser() user: JwtPayload,
    @Body() body: AiChatRequestDto,
  ) {
    return this.chat.createReply(body, user)
  }

  @Get('history')
  @ApiOperation({ summary: 'Read the authenticated user’s persisted AI support history' })
  @ApiOkResponse({ description: 'A user-scoped session id and up to fifty persisted messages.' })
  history(
    @CurrentUser() user: JwtPayload,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.chat.getHistory(user, sessionId)
  }
}
