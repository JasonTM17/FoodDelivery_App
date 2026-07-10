import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common'
import { AiUsageOutcome, ChatSenderType, ChatSessionType, Prisma } from '@prisma/client'
import type { JwtPayload } from '../auth/jwt-payload.interface'
import { PrismaService } from '../database/prisma.service'
import { AiGroundingService, AiToolCall } from './ai-grounding.service'
import { ConversationMemoryService } from './conversation-memory.service'
import { DeepSeekChatProviderService } from './deepseek-chat-provider.service'
import { OutputFilterService } from './output-filter.service'
import { SentimentDetectionService } from './sentiment-detection.service'
import { AiUsageTelemetryService } from './ai-usage-telemetry.service'

type AiChatLanguage = 'vi' | 'en' | 'ja'
const MAX_MESSAGE_LENGTH = 4000

export interface AiChatRequest {
  message: string
  sessionId?: string
  orderId?: string
}

export interface AiChatReply {
  reply: string
  sessionId: string
  action: 'answered' | 'escalated'
  escalated?: boolean
  severity?: string
  language: AiChatLanguage
  grounded?: boolean
  toolCalls?: AiToolCall[]
}

export interface AiChatHistory {
  sessionId: string | null
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    createdAt: string
  }>
}

interface PersistedChatContext {
  id: string
  orderId?: string
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
    private readonly prisma: PrismaService,
    private readonly telemetry: AiUsageTelemetryService,
  ) {}

  validateMessage(message: unknown, userId: string): string {
    if (typeof message !== 'string' || !message.trim()) {
      throw new HttpException('MESSAGE_REQUIRED', HttpStatus.BAD_REQUEST)
    }

    const normalized = message.trim()
    if (normalized.length > MAX_MESSAGE_LENGTH) {
      throw new HttpException('MESSAGE_TOO_LONG', HttpStatus.BAD_REQUEST)
    }

    if (this.outputFilter.containsInjection(normalized)) {
      this.logger.warn(`Injection in user message -- userId: ${userId}`)
      throw new HttpException('INVALID_INPUT', HttpStatus.BAD_REQUEST)
    }

    return normalized
  }

  async createReply(body: AiChatRequest, user: JwtPayload): Promise<AiChatReply> {
    const message = this.validateMessage(body?.message, user.sub)
    const requestedSessionId = optionalUuid(body?.sessionId, 'INVALID_SESSION_ID')
    const requestedOrderReference = optionalOrderReference(body?.orderId)
    const persistedContext = await this.resolvePersistedContext(
      user.sub,
      requestedSessionId,
      requestedOrderReference,
    )
    const sessionId = persistedContext?.id ?? user.sub
    const orderId = persistedContext?.orderId
    const language = detectLanguage(message)
    const persistedSessionId = persistedContext?.id ?? null

    const sentimentLabel = this.sentiment.detect(message)
    const history = await this.safeGetHistory(sessionId)
    await this.safeAppend(sessionId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    })
    await this.safePersistBatch(persistedSessionId, [
      { senderType: senderTypeForRole(user.role), senderId: user.sub, content: message },
    ])

    const groundingResult = await this.collectGrounding({
      message,
      orderId,
      userId: user.sub,
      actorRole: user.role,
      sessionId: persistedSessionId ?? undefined,
      sentimentLabel,
    })
    const toolCalls: AiToolCall[] = groundingResult.toolCalls
    const grounded = groundingResult.entries.length > 0
    const groundingEscalated = groundingResult.escalated
    const groundingSeverity: string | undefined = groundingResult.severity

    const startedAt = Date.now()
    let data: Awaited<ReturnType<DeepSeekChatProviderService['createReply']>>
    try {
      data = await this.deepSeek.createReply({
        message,
        sessionId,
        orderId,
        userId: user.sub,
        actorRole: user.role,
        sentimentLabel,
        history,
        grounding: groundingResult.entries,
      })
    } catch (err) {
      const errorCode = this.safeErrorCode(err)
      if (errorCode !== 'DEEPSEEK_NOT_CONFIGURED') {
        await this.telemetry.record({
          sessionId: persistedSessionId,
          userId: user.sub,
          provider: 'deepseek',
          model: this.deepSeek.modelName(),
          outcome: AiUsageOutcome.failed,
          latencyMs: Date.now() - startedAt,
          errorCode,
        })
      }
      this.logger.error(`AI chat provider error: ${errorCode}`)
      throw this.providerUnavailable(errorCode)
    }

    const reply = this.outputFilter.filter(data.reply).trim()
    if (!reply) {
      await this.telemetry.record({
        sessionId: persistedSessionId,
        userId: user.sub,
        provider: 'deepseek',
        model: data.model,
        outcome: AiUsageOutcome.failed,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        latencyMs: Date.now() - startedAt,
        errorCode: 'AI_RESPONSE_REJECTED',
      })
      throw this.providerUnavailable('AI_RESPONSE_REJECTED')
    }

    await this.telemetry.record({
      sessionId: persistedSessionId,
      userId: user.sub,
      provider: 'deepseek',
      model: data.model,
      outcome: AiUsageOutcome.succeeded,
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
      latencyMs: Date.now() - startedAt,
    })

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
  }

  async getHistory(user: JwtPayload, requestedSessionId?: string): Promise<AiChatHistory> {
    if (!isUuid(user.sub)) return { sessionId: null, messages: [] }
    if (requestedSessionId && !isUuid(requestedSessionId)) {
      throw new HttpException('INVALID_SESSION_ID', HttpStatus.BAD_REQUEST)
    }

    const session = await this.prisma.chatSession.findFirst({
      where: {
        id: requestedSessionId,
        userId: user.sub,
        type: ChatSessionType.ai_support,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: { id: true, senderType: true, content: true, createdAt: true },
        },
      },
    })
    if (!session) return { sessionId: null, messages: [] }

    return {
      sessionId: session.id,
      messages: session.messages.reverse().map(message => ({
        id: message.id,
        role: message.senderType === ChatSenderType.ai ? 'assistant' : 'user',
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
    }
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

  private async resolvePersistedContext(
    userId: string,
    requestedSessionId?: string,
    orderReference?: string,
  ): Promise<PersistedChatContext | null> {
    if (!isUuid(userId)) {
      throw new HttpException('AI_CONTEXT_UNAVAILABLE', HttpStatus.SERVICE_UNAVAILABLE)
    }

    if (requestedSessionId) {
      return this.requireOwnedSession(userId, requestedSessionId, orderReference)
    }

    try {
      const resolvedOrderId = await this.resolveOwnedOrderId(userId, orderReference)
      const existing = await this.prisma.chatSession.findFirst({
        where: {
          userId,
          type: ChatSessionType.ai_support,
          orderId: resolvedOrderId ?? null,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, orderId: true },
      })
      if (existing) return { id: existing.id, orderId: existing.orderId ?? undefined }

      const created = await this.prisma.chatSession.create({
        data: {
          userId,
          orderId: resolvedOrderId,
          type: ChatSessionType.ai_support,
        },
        select: { id: true, orderId: true },
      })
      return { id: created.id, orderId: created.orderId ?? resolvedOrderId }
    } catch (err) {
      if (err instanceof HttpException) throw err
      this.logger.warn(`AI chat persistence skipped: ${this.safeErrorCode(err)}`)
      if (orderReference) {
        throw new HttpException('AI_CONTEXT_UNAVAILABLE', HttpStatus.SERVICE_UNAVAILABLE)
      }
      return null
    }
  }

  private async requireOwnedSession(
    userId: string,
    sessionId: string,
    requestedOrderReference?: string,
  ): Promise<PersistedChatContext> {
    try {
      const session = await this.prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId,
          type: ChatSessionType.ai_support,
          isActive: true,
        },
        select: { id: true, orderId: true },
      })
      if (!session) {
        throw new HttpException('AI_SESSION_NOT_FOUND', HttpStatus.NOT_FOUND)
      }

      const requestedOrderId = await this.resolveOwnedOrderId(userId, requestedOrderReference)
      if (requestedOrderId && session.orderId !== requestedOrderId) {
        throw new HttpException('SESSION_ORDER_MISMATCH', HttpStatus.BAD_REQUEST)
      }

      return { id: session.id, orderId: session.orderId ?? undefined }
    } catch (err) {
      if (err instanceof HttpException) throw err
      this.logger.error(`AI session ownership check failed: ${this.safeErrorCode(err)}`)
      throw new HttpException('AI_CONTEXT_UNAVAILABLE', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  private async resolveOwnedOrderId(userId: string, orderReference?: string): Promise<string | undefined> {
    if (!orderReference) return undefined
    const reference = orderReference.trim()
    const references: Prisma.OrderWhereInput[] = [
      { orderCode: { equals: reference, mode: 'insensitive' } },
    ]
    if (isUuid(reference)) references.push({ id: reference })
    const order = await this.prisma.order.findFirst({
      where: { customerId: userId, OR: references },
      select: { id: true },
    })
    if (!order) throw new HttpException('ORDER_NOT_FOUND', HttpStatus.NOT_FOUND)
    return order.id
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
    if (/^(DEEPSEEK|MESSAGE|INVALID|AI_)[A-Z0-9_:-]*$/.test(message)) return message
    return 'UPSTREAM_UNAVAILABLE'
  }

  private async collectGrounding(input: Parameters<AiGroundingService['collect']>[0]) {
    try {
      return await this.grounding.collect(input)
    } catch (err) {
      const errorCode = this.safeErrorCode(err)
      this.logger.error(`AI grounding error: ${errorCode}`)
      throw new HttpException('AI_CONTEXT_UNAVAILABLE', HttpStatus.SERVICE_UNAVAILABLE)
    }
  }

  private providerUnavailable(errorCode: string): HttpException {
    const code = errorCode === 'DEEPSEEK_NOT_CONFIGURED'
      ? 'AI_PROVIDER_NOT_CONFIGURED'
      : 'AI_PROVIDER_UNAVAILABLE'
    return new HttpException({ code, message: code }, HttpStatus.SERVICE_UNAVAILABLE)
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

function optionalUuid(value: unknown, errorCode: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !isUuid(value.trim())) {
    throw new HttpException(errorCode, HttpStatus.BAD_REQUEST)
  }
  return value.trim()
}

function optionalOrderReference(value: unknown): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !isOrderReference(value.trim())) {
    throw new HttpException('INVALID_ORDER_ID', HttpStatus.BAD_REQUEST)
  }
  return value.trim()
}

function isOrderReference(value: string): boolean {
  return /^FD\d{10}$/i.test(value)
    || /^F[DF]-?\d{3,10}$/i.test(value)
    || isUuid(value)
}

function senderTypeForRole(role: string): ChatSenderType {
  if (role === 'driver') return ChatSenderType.driver
  if (role === 'restaurant') return ChatSenderType.restaurant
  if (role === 'admin') return ChatSenderType.admin
  return ChatSenderType.customer
}

function strongestSeverity(...values: Array<string | undefined>): string | undefined {
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  return values
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => order.indexOf(b.toUpperCase()) - order.indexOf(a.toUpperCase()))[0]
}
