import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatSessionType, SupportChannel } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'

export type AiMonitorStatus = 'online' | 'degraded' | 'not_configured'

export interface AdminAiMonitorOverview {
  instance: {
    status: AiMonitorStatus
    dashboardUrl: string | null
    degradedReason: string | null
    provider: 'deepseek'
    model: string
  }
  stats: AdminAiMonitorStats
}

export interface AdminAiMonitorStats {
  totalConversations: number | null
  selfResolved: number | null
  escalated: number | null
  resolutionRate: number | null
  costTodayUsd: number | null
  budgetTodayUsd: number | null
  inputTokens: number | null
  outputTokens: number | null
  requests: number | null
  averageLatencyMs: number | null
}

@Injectable()
export class AdminAiMonitorService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getOverview(): Promise<AdminAiMonitorOverview> {
    const configured = Boolean(this.firstConfigured('DEEPSEEK_API_KEY'))
    const conversationStats = await this.getConversationStats()
    const statsAvailable = conversationStats !== null

    return {
      instance: {
        status: configured ? (statsAvailable ? 'online' : 'degraded') : 'not_configured',
        dashboardUrl: this.firstConfigured('DEEPSEEK_DASHBOARD_URL'),
        degradedReason: configured
          ? (statsAvailable ? null : 'AI_MONITOR_STATS_UNAVAILABLE')
          : 'DEEPSEEK_NOT_CONFIGURED',
        provider: 'deepseek',
        model: this.firstConfigured('DEEPSEEK_MODEL') ?? 'deepseek-v4-flash',
      },
      stats: {
        totalConversations: conversationStats?.totalConversations ?? null,
        selfResolved: conversationStats?.selfResolved ?? null,
        escalated: conversationStats?.escalated ?? null,
        resolutionRate: conversationStats?.resolutionRate ?? null,
        costTodayUsd: null,
        budgetTodayUsd: this.numberConfig('DEEPSEEK_DAILY_BUDGET_USD', 'AI_DAILY_BUDGET_USD'),
        inputTokens: null,
        outputTokens: null,
        requests: null,
        averageLatencyMs: null,
      },
    }
  }

  private async getConversationStats(): Promise<Pick<
    AdminAiMonitorStats,
    'totalConversations' | 'selfResolved' | 'escalated' | 'resolutionRate'
  > | null> {
    try {
      const [sessions, escalatedTickets] = await Promise.all([
        this.prisma.chatSession.findMany({
          where: { type: ChatSessionType.ai_support },
          select: { id: true },
        }),
        this.prisma.aiSupportTicket.findMany({
          where: { channel: SupportChannel.ai_chat },
          select: { tags: true },
        }),
      ])
      const escalatedSessionIds = new Set<string>()

      for (const ticket of escalatedTickets) {
        for (const tag of ticket.tags) {
          if (tag.startsWith('ai_session:')) {
            escalatedSessionIds.add(tag.slice('ai_session:'.length))
          }
        }
      }

      const totalConversations = sessions.length
      const selfResolved = sessions.filter(session => !escalatedSessionIds.has(session.id)).length
      const escalated = escalatedTickets.length

      return {
        totalConversations,
        selfResolved,
        escalated,
        resolutionRate: totalConversations > 0 ? round1(selfResolved / totalConversations * 100) : 0,
      }
    } catch {
      return null
    }
  }

  private firstConfigured(...keys: string[]): string | null {
    for (const key of keys) {
      const value = this.config.get<string>(key)
      if (isConfigured(value)) return value.trim()
    }
    return null
  }

  private numberConfig(...keys: string[]): number | null {
    for (const key of keys) {
      const raw = this.config.get<string>(key)
      if (!raw?.trim()) continue
      const value = Number(raw)
      if (Number.isFinite(value)) return value
    }
    return null
  }
}

function isConfigured(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const normalized = value.trim()
  if (!normalized) return false
  return ![
    /^(your[-_\s]|replace[-_\s]?with|replace[-_\s]?me|placeholder|example)/i,
    /example\.com$/i,
    /change[-_\s]?me/i,
  ].some(pattern => pattern.test(normalized))
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}
