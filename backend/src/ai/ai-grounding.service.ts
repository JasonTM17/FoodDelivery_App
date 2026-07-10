import { Injectable, NotFoundException } from '@nestjs/common'
import { TicketPriority } from '@prisma/client'
import { AiToolsService } from './ai-tools.service'
import { AiToolName, ToolJustificationService } from './tool-justification.service'

export interface AiToolCall {
  name: AiToolName
  args: Record<string, unknown>
}

export interface AiGroundingEntry {
  tool: AiToolName
  data: unknown
}

export interface AiGroundingResult {
  toolCalls: AiToolCall[]
  entries: AiGroundingEntry[]
  escalated: boolean
  severity?: 'MEDIUM' | 'HIGH'
}

interface GroundingInput {
  message: string
  orderId?: string
  userId: string
  actorRole?: string
  sessionId?: string
  sentimentLabel: string
}

@Injectable()
export class AiGroundingService {
  constructor(
    private readonly tools: AiToolsService,
    private readonly justification: ToolJustificationService,
  ) {}

  async collect(input: GroundingInput): Promise<AiGroundingResult> {
    const entries: AiGroundingEntry[] = []
    const toolCalls: AiToolCall[] = []
    const orderReference = input.orderId?.trim() || extractOrderReference(input.message)
    const severity = classifySeverity(input.message, input.sentimentLabel)
    const canUseCustomerTools = !input.actorRole || input.actorRole === 'customer'

    const run = async (
      tool: AiToolName,
      args: Record<string, unknown>,
      action: () => Promise<unknown>,
    ): Promise<void> => {
      if (!this.justification.validate(tool, input.message, severity)) return
      const data = await this.execute(action)
      toolCalls.push({ name: tool, args })
      entries.push({ tool, data })
    }

    if (canUseCustomerTools && orderReference) {
      const args = { orderReference }
      await run('getOrderStatus', args, () => this.tools.getOrderStatus(orderReference, input.userId))
      await run('getDriverLocation', args, () => this.tools.getDriverLocation(orderReference, input.userId))
      await run('getRestaurantStatus', args, () => this.tools.getRestaurantStatus(orderReference, input.userId))
      await run('getRefundEligibility', args, () => this.tools.getRefundEligibility(orderReference, input.userId))
    }

    if (canUseCustomerTools) {
      await run('getRecommendedFoods', {}, () => this.tools.getRecommendedFoods(input.userId))
    }

    if (severity && this.justification.validate('createSupportTicket', input.message, severity)) {
      const ticket = await this.execute(() => this.tools.createSupportTicket(
        input.userId,
        orderReference,
        classifyIssueType(input.message),
        input.message,
        severity === 'HIGH' ? TicketPriority.high : TicketPriority.medium,
        input.sessionId,
      ))
      const ticketId = readString(ticket, 'id')
      toolCalls.push({ name: 'createSupportTicket', args: { orderReference: orderReference ?? null } })
      entries.push({ tool: 'createSupportTicket', data: ticket })

      if (severity === 'HIGH' && ticketId && this.justification.validate('notifyAdmin', input.message, severity)) {
        const notification = await this.tools.notifyAdmin(ticketId, severity, input.userId)
        toolCalls.push({ name: 'notifyAdmin', args: { ticketId, severity } })
        entries.push({ tool: 'notifyAdmin', data: notification })
      }
    }

    return { toolCalls, entries, escalated: Boolean(severity), severity }
  }

  private async execute(action: () => Promise<unknown>): Promise<unknown> {
    try {
      return await action()
    } catch (error) {
      if (error instanceof NotFoundException) return { found: false }
      throw error
    }
  }
}

function extractOrderReference(message: string): string | undefined {
  return message.match(/\bFD\d{10}\b/i)?.[0]
    ?? message.match(/\bF[DF]-?\d{3,10}\b/i)?.[0]
    ?? message.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}\b/i)?.[0]
}

function classifySeverity(message: string, sentimentLabel: string): 'MEDIUM' | 'HIGH' | undefined {
  const text = normalizeSearchText(message)
  if (
    sentimentLabel === 'angry'
    || hasAny(text, ['khong bat may', 'unreachable', 'bi tru tien', 'charged', 'di vat', 'ngo doc', 'fraud', 'gian lan', '1 tieng', '1 gio', '60 phut'])
  ) {
    return 'HIGH'
  }
  if (hasAny(text, ['di ung', 'allerg', 'thieu mon', 'sai mon', 'wrong item', 'missing item'])) {
    return 'MEDIUM'
  }
  return undefined
}

function classifyIssueType(message: string): string {
  const text = normalizeSearchText(message)
  if (hasAny(text, ['hoan tien', 'refund'])) return 'refund_request'
  if (hasAny(text, ['thieu mon', 'missing item'])) return 'missing_item'
  if (hasAny(text, ['sai mon', 'wrong item'])) return 'wrong_item'
  if (hasAny(text, ['tai xe', 'driver', 'shipper'])) return 'driver_issue'
  if (hasAny(text, ['tre', 'cham', 'delay', 'late'])) return 'late_delivery'
  return 'other'
}

function normalizeSearchText(message: string): string {
  return message
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/gi, match => (match === 'Đ' ? 'D' : 'd'))
    .toLowerCase()
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some(needle => text.includes(needle))
}

function readString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' ? field : undefined
}
