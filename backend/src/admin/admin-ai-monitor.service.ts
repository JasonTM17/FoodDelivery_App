import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AiUsageOutcome, ChatSessionType, SupportChannel } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'

export type AiMonitorStatus = 'online' | 'degraded' | 'not_configured'
export type AiTelemetryStatus = 'live' | 'awaiting_requests' | 'unavailable'

export interface AdminAiMonitorOverview {
  instance: {
    status: AiMonitorStatus
    dashboardUrl: string | null
    degradedReason: string | null
    provider: 'deepseek'
    model: string
    telemetry: {
      status: AiTelemetryStatus
      lastRequestAt: string | null
      lastSuccessfulRequestAt: string | null
      lastFailureCode: string | null
    }
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
  failedRequests: number | null
  averageLatencyMs: number | null
}

interface AiUsageStats {
  inputTokens: number | null
  outputTokens: number | null
  requests: number
  failedRequests: number
  averageLatencyMs: number | null
  lastRequestAt: Date | null
  lastSuccessfulRequestAt: Date | null
  lastFailureCode: string | null
}

@Injectable()
export class AdminAiMonitorService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getOverview(): Promise<AdminAiMonitorOverview> {
    const configured = Boolean(this.firstConfigured('DEEPSEEK_API_KEY'))
    const [conversationStats, usageStats] = await Promise.all([
      this.getConversationStats(),
      this.getUsageStats(),
    ])
    const instanceState = this.instanceState(configured, usageStats)

    return {
      instance: {
        status: instanceState.status,
        dashboardUrl: this.firstConfigured('DEEPSEEK_DASHBOARD_URL'),
        degradedReason: instanceState.degradedReason,
        provider: 'deepseek',
        model: this.firstConfigured('DEEPSEEK_MODEL') ?? 'deepseek-v4-flash',
        telemetry: {
          status: usageStats === null
            ? 'unavailable'
            : usageStats.requests === 0 ? 'awaiting_requests' : 'live',
          lastRequestAt: usageStats?.lastRequestAt?.toISOString() ?? null,
          lastSuccessfulRequestAt: usageStats?.lastSuccessfulRequestAt?.toISOString() ?? null,
          lastFailureCode: usageStats?.lastFailureCode ?? null,
        },
      },
      stats: {
        totalConversations: conversationStats?.totalConversations ?? null,
        selfResolved: conversationStats?.selfResolved ?? null,
        escalated: conversationStats?.escalated ?? null,
        resolutionRate: conversationStats?.resolutionRate ?? null,
        // Do not estimate pricing from token counts. Provider billing is the
        // only source of truth for cost.
        costTodayUsd: null,
        budgetTodayUsd: this.numberConfig('DEEPSEEK_DAILY_BUDGET_USD', 'AI_DAILY_BUDGET_USD'),
        inputTokens: usageStats?.inputTokens ?? null,
        outputTokens: usageStats?.outputTokens ?? null,
        requests: usageStats?.requests ?? null,
        failedRequests: usageStats?.failedRequests ?? null,
        averageLatencyMs: usageStats?.averageLatencyMs ?? null,
      },
    }
  }

  private instanceState(
    configured: boolean,
    usageStats: AiUsageStats | null,
  ): { status: AiMonitorStatus; degradedReason: string | null } {
    if (!configured) return { status: 'not_configured', degradedReason: 'DEEPSEEK_NOT_CONFIGURED' }
    if (usageStats === null) return { status: 'degraded', degradedReason: 'AI_MONITOR_TELEMETRY_UNAVAILABLE' }
    if (usageStats.requests === 0) return { status: 'degraded', degradedReason: 'AI_TELEMETRY_PENDING' }
    if (usageStats.lastFailureCode) return { status: 'degraded', degradedReason: usageStats.lastFailureCode }
    return { status: 'online', degradedReason: null }
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
      const escalated = totalConversations - selfResolved

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

  private async getUsageStats(): Promise<AiUsageStats | null> {
    const now = new Date()
    const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    try {
      const [aggregate, failedRequests, latest, latestSuccess] = await Promise.all([
        this.prisma.aiUsageEvent.aggregate({
          where: { createdAt: { gte: since } },
          _sum: { inputTokens: true, outputTokens: true },
          _avg: { latencyMs: true },
          _count: { _all: true },
        }),
        this.prisma.aiUsageEvent.count({
          where: { createdAt: { gte: since }, outcome: AiUsageOutcome.failed },
        }),
        this.prisma.aiUsageEvent.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, outcome: true, errorCode: true },
        }),
        this.prisma.aiUsageEvent.findFirst({
          where: { outcome: AiUsageOutcome.succeeded },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ])

      return {
        inputTokens: aggregate._sum.inputTokens ?? null,
        outputTokens: aggregate._sum.outputTokens ?? null,
        requests: aggregate._count._all,
        failedRequests,
        averageLatencyMs: aggregate._avg.latencyMs == null
          ? null
          : Math.round(aggregate._avg.latencyMs),
        lastRequestAt: latest?.createdAt ?? null,
        lastSuccessfulRequestAt: latestSuccess?.createdAt ?? null,
        lastFailureCode: latest?.outcome === AiUsageOutcome.failed ? latest.errorCode ?? 'AI_PROVIDER_UNAVAILABLE' : null,
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
