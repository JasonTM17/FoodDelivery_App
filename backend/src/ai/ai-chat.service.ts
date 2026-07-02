import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { I18nService } from 'nestjs-i18n'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { ConversationMemoryService } from './conversation-memory.service'
import { DeepSeekChatProviderService } from './deepseek-chat-provider.service'
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
    private readonly deepSeek: DeepSeekChatProviderService,
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
      await this.safeAppendBatch(sessionId, [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
      ])
      return { reply, sessionId, action: 'answered' }
    }

    const sentimentLabel = this.sentiment.detect(message)
    const history = await this.safeGetHistory(sessionId)
    await this.safeAppend(sessionId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    })

    try {
      const data = await this.fetchProviderReply({ message, sessionId, orderId, userId: user.sub, sentimentLabel, history })
      const rawReply = data.reply ?? this.translate('ai_templates.fallback')
      const reply = this.outputFilter.filter(rawReply)

      await this.safeAppend(sessionId, {
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
      this.logger.error(`AI chat provider error: ${this.safeErrorCode(err)}`)
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

  private async fetchProviderReply(input: {
    message: string
    sessionId: string
    orderId?: string
    userId: string
    sentimentLabel: string
    history: unknown[]
  }) {
    const provider = this.chatProvider()
    if (provider === 'deepseek') {
      return this.deepSeek.createReply(input)
    }

    return this.fetchN8nReply(input)
  }

  private chatProvider(): 'deepseek' | 'n8n' {
    const configured = this.config.get<string>('AI_CHAT_PROVIDER')?.trim().toLowerCase()
    if (configured === 'deepseek' || configured === 'n8n') return configured
    if (this.config.get<string>('DEEPSEEK_API_KEY')?.trim()) return 'deepseek'
    return 'n8n'
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

  private async safeGetHistory(sessionId: string): Promise<unknown[]> {
    try {
      return await this.memory.getHistory(sessionId)
    } catch (err) {
      this.logger.warn(`AI chat memory read skipped: ${this.safeErrorCode(err)}`)
      return []
    }
  }

  private async safeAppend(sessionId: string, message: { role: 'user' | 'assistant'; content: string; timestamp: string }): Promise<void> {
    try {
      await this.memory.append(sessionId, message)
    } catch (err) {
      this.logger.warn(`AI chat memory append skipped: ${this.safeErrorCode(err)}`)
    }
  }

  private async safeAppendBatch(sessionId: string, messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>): Promise<void> {
    try {
      await this.memory.appendBatch(sessionId, messages)
    } catch (err) {
      this.logger.warn(`AI chat memory append skipped: ${this.safeErrorCode(err)}`)
    }
  }

  private safeErrorCode(err: unknown): string {
    const message = err instanceof Error ? err.message : 'UNKNOWN'
    if (/^(DEEPSEEK|N8N|MESSAGE|INVALID)[A-Z0-9_:-]*$/.test(message)) return message
    return 'UPSTREAM_UNAVAILABLE'
  }
}
