import { Body, Controller, HttpException, Post, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AiChatRequestDto } from './ai-chat.dto'
import { AiChatService } from './ai-chat.service'

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  constructor(private readonly chat: AiChatService) {}

  @Post('stream')
  @ApiOperation({ summary: 'Receive a completed safety-filtered AI reply over SSE' })
  @ApiProduces('text/event-stream')
  @ApiBody({ type: AiChatRequestDto })
  async stream(
    @Body() body: AiChatRequestDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-store')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const emit = (type: string, content: string): void => {
      res.write(`data: ${JSON.stringify({ type, content })}\n\n`)
    }

    emit('thinking', '')
    try {
      const result = await this.chat.createReply(body, user)
      // The provider response is safety-filtered before it reaches SSE. Do not
      // fabricate word-by-word tokens from a complete response.
      emit('response', result.reply)
      if (result.escalated) emit('escalated', result.severity ?? 'HIGH')
      emit('done', '')
    } catch (error) {
      emit('error', publicAiErrorCode(error))
      emit('done', '')
    } finally {
      res.end()
    }
  }
}

const PUBLIC_AI_ERROR_CODES = new Set([
  'AI_CONTEXT_UNAVAILABLE',
  'AI_PROVIDER_NOT_CONFIGURED',
  'AI_PROVIDER_UNAVAILABLE',
  'AI_SESSION_NOT_FOUND',
  'INVALID_INPUT',
  'INVALID_ORDER_ID',
  'INVALID_SESSION_ID',
  'MESSAGE_REQUIRED',
  'MESSAGE_TOO_LONG',
  'ORDER_NOT_FOUND',
  'SESSION_ORDER_MISMATCH',
])

function publicAiErrorCode(error: unknown): string {
  if (!(error instanceof HttpException)) return 'AI_PROVIDER_UNAVAILABLE'
  const response = error.getResponse()
  const candidate = typeof response === 'string'
    ? response
    : readString(response, 'code')
  return candidate && PUBLIC_AI_ERROR_CODES.has(candidate)
    ? candidate
    : 'AI_PROVIDER_UNAVAILABLE'
}

function readString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' ? field : undefined
}
