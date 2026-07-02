import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AiChatRequest, AiChatService } from './ai-chat.service'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly chat: AiChatService) {}

  @Post('stream')
  async stream(
    @Body() body: AiChatRequest,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    this.chat.validateMessage(body.message, user.sub)

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-store')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const emit = (type: string, content: string): void => {
      res.write(`data: ${JSON.stringify({ type, content })}\n\n`)
    }

    emit('thinking', '')
    const result = await this.chat.createReply(body, user)
    this.emitWords(result.reply, emit)
    if (result.escalated) emit('escalated', result.severity ?? 'HIGH')
    if (result.action === 'degraded') emit('degraded', 'AI_SERVICE_UNAVAILABLE')
    emit('done', '')
    res.end()
  }

  private emitWords(text: string, emit: (type: string, content: string) => void): void {
    const tokens = text.split(/(\s+)/)
    for (const token of tokens) {
      if (token) emit('token', token)
    }
  }
}
