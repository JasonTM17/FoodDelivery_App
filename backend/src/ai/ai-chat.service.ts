import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { I18nService } from 'nestjs-i18n'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { ConversationMemoryService } from './conversation-memory.service'
import { DeepSeekChatProviderService } from './deepseek-chat-provider.service'
import { OutputFilterService } from './output-filter.service'
import { SentimentDetectionService } from './sentiment-detection.service'

type FastPathKey = 'greeting' | 'thank_you' | 'app_error_hint' | 'faq_hint'

const FAST_PATH: [RegExp, FastPathKey][] = [
  [/^(xin\s*ch\u00e0o|hello|hi\b|ch\u00e0o\s*b\u1ea1n|hey\b)/i, 'greeting'],
  [/\bc\u1ea3m\s*\u01a1n\b|thank\s*(you|u)\b/i, 'thank_you'],
  [/app.*l\u1ed7i|\u1ee9ng\s*d\u1ee5ng.*kh\u00f4ng\s*(m\u1edf|ch\u1ea1y|ho\u1ea1t)/i, 'app_error_hint'],
  [/faq|c\u00e2u\s*h\u1ecfi\s*th\u01b0\u1eddng\s*g\u1eb7p|h\u01b0\u1edbng\s*d\u1eabn\s*d\u00f9ng/i, 'faq_hint'],
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
    private readonly i18n: I18nService,
  ) {}

  validateMessage(message: string, userId: string): void {
    if (!message?.trim()) {
      throw new HttpException('MESSAGE_REQUIRED', HttpStatus.BAD_REQUEST)
    }

    if (this.outputFilter.containsInjection(message)) {
      this.logger.warn(`Injection in user message -- userId: ${userId}`)
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
      const data = await this.deepSeek.createReply({
        message,
        sessionId,
        orderId,
        userId: user.sub,
        sentimentLabel,
        history,
      })
      const reply = this.outputFilter.filter(data.reply)

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
    if (/^(DEEPSEEK|MESSAGE|INVALID)[A-Z0-9_:-]*$/.test(message)) return message
    return 'UPSTREAM_UNAVAILABLE'
  }
}
