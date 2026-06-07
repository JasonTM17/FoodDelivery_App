import {
  Controller, Post, Body, Res, UseGuards, HttpException, HttpStatus, Logger,
} from '@nestjs/common'
import type { Response } from 'express'
import { I18nService } from 'nestjs-i18n'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { ConversationMemoryService } from './conversation-memory.service'
import { SentimentDetectionService } from './sentiment-detection.service'
import { OutputFilterService } from './output-filter.service'
import { ToolJustificationService } from './tool-justification.service'
import { ConfigService } from '@nestjs/config'

// Fast-path patterns — handled without N8N (RT-03b pre-classification)
const FAST_PATH: [RegExp, string][] = [
  [/^(xin\s*chào|hello|hi\b|chào\s*bạn|hey\b)/i,
    'Xin chào! Tôi là FoodFlow Bot 🍜. Bạn cần hỗ trợ gì hôm nay?'],
  [/cảm\s*ơn|thank\s*(you|u)\b/i,
    'Rất vui được giúp bạn! Chúc bạn ngon miệng với FoodFlow 😊'],
  [/app.*lỗi|ứng\s*dụng.*không\s*(mở|chạy|hoạt)/i,
    'Bạn thử khởi động lại ứng dụng hoặc kiểm tra kết nối mạng nhé. Nếu vẫn lỗi hãy nhắn lại tôi.'],
  [/faq|câu\s*hỏi\s*thường\s*gặp|hướng\s*dẫn\s*dùng/i,
    'Bạn có thể tìm câu trả lời trong mục "Trợ giúp" trong ứng dụng, hoặc cho tôi biết vấn đề cụ thể nhé.'],
]

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name)

  constructor(
    private readonly memory: ConversationMemoryService,
    private readonly sentiment: SentimentDetectionService,
    private readonly outputFilter: OutputFilterService,
    private readonly toolJustification: ToolJustificationService,
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  @Post('stream')
  async stream(
    @Body() body: { message: string; sessionId?: string; orderId?: string },
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ): Promise<void> {
    const { message, orderId } = body
    const sessionId = body.sessionId ?? user.sub

    if (!message?.trim()) {
      throw new HttpException('MESSAGE_REQUIRED', HttpStatus.BAD_REQUEST)
    }

    // Reject injection attempts in user input before any processing
    if (this.outputFilter.containsInjection(message)) {
      this.logger.warn(`Injection in user message — userId: ${user.sub}`)
      throw new HttpException('INVALID_INPUT', HttpStatus.BAD_REQUEST)
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-store')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const emit = (type: string, content: string): void => {
      res.write(`data: ${JSON.stringify({ type, content })}\n\n`)
    }

    // TTFB: emit immediately so client knows server acknowledged
    emit('thinking', '')

    // Fast path — skip N8N entirely (~70% of traffic)
    for (const [pattern, reply] of FAST_PATH) {
      if (pattern.test(message.trim())) {
        await this.memory.appendBatch(sessionId, [
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
        ])
        this.emitWords(reply, emit)
        emit('done', '')
        res.end()
        return
      }
    }

    const sentimentLabel = this.sentiment.detect(message)
    const history = await this.memory.getHistory(sessionId)
    await this.memory.append(sessionId, {
      role: 'user', content: message, timestamp: new Date().toISOString(),
    })

    const n8nUrl = this.config.get<string>(
      'N8N_WEBHOOK_URL',
      'http://n8n:5678/webhook/ai-support-chat',
    )

    try {
      const resp = await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.sub, message, sessionId, orderId, sentiment: sentimentLabel, history }),
        signal: AbortSignal.timeout(15_000),
      })

      if (!resp.ok) {
        this.logger.error(`N8N responded with HTTP ${resp.status}`)
        throw new Error(`N8N_ERROR_${resp.status}`)
      }

      const data = (await resp.json()) as { reply?: string; escalated?: boolean; severity?: string }
      const rawReply = data.reply ?? (this.i18n.t('ai_templates.fallback') as string)
      const reply = this.outputFilter.filter(rawReply)

      await this.memory.append(sessionId, {
        role: 'assistant', content: reply, timestamp: new Date().toISOString(),
      })

      this.emitWords(reply, emit)

      if (data.escalated) emit('escalated', data.severity ?? 'HIGH')
    } catch (err) {
      this.logger.error(`AI stream error: ${(err as Error).message}`)
      const fallback = this.i18n.t('ai_templates.service_unavailable') as string
      this.emitWords(fallback, emit)
    }

    emit('done', '')
    res.end()
  }

  private emitWords(text: string, emit: (type: string, content: string) => void): void {
    // Split by spaces preserving punctuation for natural token cadence
    const tokens = text.split(/(\s+)/)
    for (const token of tokens) {
      if (token) emit('token', token)
    }
  }
}
