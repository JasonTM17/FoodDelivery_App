import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nService } from 'nestjs-i18n'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { ConversationMemoryService } from './conversation-memory.service'
import { OutputFilterService } from './output-filter.service'
import { SentimentDetectionService } from './sentiment-detection.service'

type FastPathKey = 'greeting' | 'thank_you' | 'app_error_hint' | 'faq_hint'

const FAST_PATH: [RegExp, FastPathKey][] = [
  [/^(xin\s*chào|hello|hi\b|chào\s*bạn|hey\b)/i, 'greeting'],
  [/cảm\s*ơn|thank\s*(you|u)\b/i, 'thank_you'],
  [/app.*lỗi|ứng\s*dụng.*không\s*(mở|chạy|hoạt)/i, 'app_error_hint'],
  [/faq|câu\s*hỏi\s*thường\s*gặp|hướng\s*dẫn\s*dùng/i, 'faq_hint'],
]

export interface AiChatRequest {
  message: string
  sessionId?: string
  orderId?: string
}

export interface AiChatReply {
  reply: string
  sessionId: string
  action: 'answered' | 'escalated' | 'degraded'
  escalated?: boolean
  severity?: string
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name)

  constructor(
    private readonly memory: ConversationMemoryService,
    private readonly sentiment: SentimentDetectionService,
    private readonly outputFilter: OutputFilterService,
    private readonly config: ConfigService,
    private readonly i18n: I18nService,
  ) {}

  validateMessage(message: string, userId: string): void {
    if (!message?.trim()) {
      throw new HttpException('MESSAGE_REQUIRED', HttpStatus.BAD_REQUEST)
    }

    if (this.outputFilter.containsInjection(message)) {
      this.logger.warn(`Injection in user message — userId: ${userId}`)
      throw new HttpException('INVALID_INPUT', HttpStatus.BAD_REQUEST)
    }
  }

  async createReply(body: AiChatRequest, user: JwtPayload): Promise<AiChatReply> {
    const { message, orderId } = body
    const sessionId = body.sessionId ?? user.sub
    this.validateMessage(message, user.sub)

    const fastPathKey = this.matchFastPath(message.trim())
    if (fastPathKey) {
      const reply = this.translate(`ai_templates.${fastPathKey}`)
      await this.memory.appendBatch(sessionId, [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
      ])
      return { reply, sessionId, action: 'answered' }
    }

    const sentimentLabel = this.sentiment.detect(message)
    const history = await this.memory.getHistory(sessionId)
    await this.memory.append(sessionId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    })

    try {
      const data = await this.fetchN8nReply({ message, sessionId, orderId, userId: user.sub, sentimentLabel, history })
      const rawReply = data.reply ?? this.translate('ai_templates.fallback')
      const reply = this.outputFilter.filter(rawReply)

      await this.memory.append(sessionId, {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      })

      return {
        reply,
        sessionId,
        action: data.escalated ? 'escalated' : 'answered',
        escalated: data.escalated,
        severity: data.severity,
      }
    } catch (err) {
      this.logger.error(`AI chat error: ${(err as Error).message}`)
      return {
        reply: this.translate('ai_templates.service_unavailable'),
        sessionId,
        action: 'degraded',
      }
    }
  }

  private matchFastPath(message: string): FastPathKey | undefined {
    return FAST_PATH.find(([pattern]) => pattern.test(message))?.[1]
  }

  private async fetchN8nReply({
    message,
    sessionId,
    orderId,
    userId,
    sentimentLabel,
    history,
  }: {
    message: string
    sessionId: string
    orderId?: string
    userId: string
    sentimentLabel: string
    history: unknown[]
  }) {
    const n8nUrl = this.config.get<string>('N8N_WEBHOOK_URL', 'http://n8n:5678/webhook/ai-support-chat')
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message, sessionId, orderId, sentiment: sentimentLabel, history }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      throw new Error(`N8N_ERROR_${response.status}`)
    }

    return response.json() as Promise<{ reply?: string; escalated?: boolean; severity?: string }>
  }

  private translate(key: string): string {
    return this.i18n.t(key) as string
  }
}
