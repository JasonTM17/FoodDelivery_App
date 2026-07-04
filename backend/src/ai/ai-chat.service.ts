import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { ChatSenderType, ChatSessionType } from '@prisma/client'
import { I18nService } from 'nestjs-i18n'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { PrismaService } from '../database/prisma.service'
import { AiGroundingService, AiToolCall } from './ai-grounding.service'
import { ConversationMemoryService } from './conversation-memory.service'
import { DeepSeekChatProviderService } from './deepseek-chat-provider.service'
import { OutputFilterService } from './output-filter.service'
import { SentimentDetectionService } from './sentiment-detection.service'

type FastPathKey = 'greeting' | 'thank_you' | 'app_error_hint' | 'faq_hint'
type AiChatLanguage = 'vi' | 'en' | 'ja'

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
  language: AiChatLanguage
  grounded?: boolean
  toolCalls?: AiToolCall[]
}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name)

  constructor(
    private readonly memory: ConversationMemoryService,
    private readonly sentiment: SentimentDetectionService,
    private readonly outputFilter: OutputFilterService,
    private readonly deepSeek: DeepSeekChatProviderService,
    private readonly grounding: AiGroundingService,
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService,
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
    const sessionId = body.sessionId?.trim() || user.sub
    const language = detectLanguage(message)
    this.validateMessage(message, user.sub)
    const persistedSessionId = await this.safeEnsurePersistedSession(user.sub, orderId)

    const fastPathKey = this.matchFastPath(message.trim())
    if (fastPathKey) {
      const reply = this.translate(`ai_templates.${fastPathKey}`)
      await this.safeAppendBatch(sessionId, [
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: reply, timestamp: new Date().toISOString() },
      ])
      await this.safePersistBatch(persistedSessionId, [
        { senderType: ChatSenderType.customer, senderId: user.sub, content: message },
        { senderType: ChatSenderType.ai, senderId: null, content: reply },
      ])
      return { reply, sessionId, action: 'answered', language, grounded: false }
    }

    const sentimentLabel = this.sentiment.detect(message)
    const history = await this.safeGetHistory(sessionId)
    let toolCalls: AiToolCall[] = []
    let grounded = false
    let groundingEscalated = false
    let groundingSeverity: string | undefined
    await this.safeAppend(sessionId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    })
    await this.safePersistBatch(persistedSessionId, [
      { senderType: ChatSenderType.customer, senderId: user.sub, content: message },
    ])

    try {
      const groundingResult = await this.grounding.collect({
        message,
        orderId,
        userId: user.sub,
        sessionId: persistedSessionId ?? undefined,
        sentimentLabel,
      })
      toolCalls = groundingResult.toolCalls
      grounded = groundingResult.entries.length > 0
      groundingEscalated = groundingResult.escalated
      groundingSeverity = groundingResult.severity

      const data = await this.deepSeek.createReply({
        message,
        sessionId,
        orderId,
        userId: user.sub,
        sentimentLabel,
        history,
        grounding: groundingResult.entries,
      })
      const reply = this.outputFilter.filter(data.reply)
      const escalated = Boolean(data.escalated || groundingEscalated)
      const severity = strongestSeverity(data.severity, groundingSeverity)

      await this.safeAppend(sessionId, {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      })
      await this.safePersistBatch(persistedSessionId, [
        { senderType: ChatSenderType.ai, senderId: null, content: reply },
      ])

      return {
        reply,
        sessionId,
        action: escalated ? 'escalated' : 'answered',
        escalated,
        severity,
        language,
        grounded,
        toolCalls: toolCalls.length ? toolCalls : undefined,
      }
    } catch (err) {
      this.logger.error(`AI chat provider error: ${this.safeErrorCode(err)}`)
      const reply = this.translate('ai_templates.service_unavailable')
      await this.safePersistBatch(persistedSessionId, [
        { senderType: ChatSenderType.ai, senderId: null, content: reply },
      ])
      return {
        reply,
        sessionId,
        action: 'degraded',
        escalated: groundingEscalated || undefined,
        severity: groundingSeverity,
        language,
        grounded,
        toolCalls: toolCalls.length ? toolCalls : undefined,
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

  private async safeEnsurePersistedSession(userId: string, orderId?: string): Promise<string | null> {
    if (!isUuid(userId)) return null

    try {
      const resolvedOrderId = await this.safeResolveOwnedOrderId(userId, orderId)
      const existing = await this.prisma.chatSession.findFirst({
        where: {
          userId,
          type: ChatSessionType.ai_support,
          orderId: resolvedOrderId ?? null,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })
      if (existing) return existing.id

      const created = await this.prisma.chatSession.create({
        data: {
          userId,
          orderId: resolvedOrderId,
          type: ChatSessionType.ai_support,
        },
        select: { id: true },
      })
      return created.id
    } catch (err) {
      this.logger.warn(`AI chat persistence skipped: ${this.safeErrorCode(err)}`)
      return null
    }
  }

  private async safeResolveOwnedOrderId(userId: string, orderId?: string): Promise<string | undefined> {
    if (!orderId || !isUuid(orderId)) return undefined
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, customerId: userId },
      select: { id: true },
    })
    return order?.id
  }

  private async safePersistBatch(
    sessionId: string | null,
    messages: Array<{ senderType: ChatSenderType; senderId: string | null; content: string }>,
  ): Promise<void> {
    if (!sessionId || messages.length === 0) return

    try {
      await this.prisma.chatMessage.createMany({
        data: messages.map(message => ({
          sessionId,
          senderType: message.senderType,
          senderId: message.senderId,
          content: message.content,
        })),
      })
    } catch (err) {
      this.logger.warn(`AI chat message persistence skipped: ${this.safeErrorCode(err)}`)
    }
  }

  private safeErrorCode(err: unknown): string {
    const message = err instanceof Error ? err.message : 'UNKNOWN'
    if (/^(DEEPSEEK|MESSAGE|INVALID)[A-Z0-9_:-]*$/.test(message)) return message
    return 'UPSTREAM_UNAVAILABLE'
  }
}

function detectLanguage(message: string): AiChatLanguage {
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(message)) return 'ja'
  if (isAscii(message) && /[a-z]/i.test(message)) return 'en'
  return 'vi'
}

function isAscii(value: string): boolean {
  return [...value].every(character => character.charCodeAt(0) <= 0x7f)
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function strongestSeverity(...values: Array<string | undefined>): string | undefined {
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => order.indexOf(b.toUpperCase()) - order.indexOf(a.toUpperCase()))[0]
}
