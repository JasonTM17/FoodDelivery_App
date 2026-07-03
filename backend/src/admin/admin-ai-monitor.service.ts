import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

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
  constructor(private readonly config: ConfigService) {}

  getOverview(): AdminAiMonitorOverview {
    const configured = Boolean(this.firstConfigured('DEEPSEEK_API_KEY'))

    return {
      instance: {
        status: configured ? 'degraded' : 'not_configured',
        dashboardUrl: this.firstConfigured('DEEPSEEK_DASHBOARD_URL'),
        degradedReason: configured ? 'AI_MONITOR_TELEMETRY_NOT_ENABLED' : 'DEEPSEEK_NOT_CONFIGURED',
        provider: 'deepseek',
        model: this.firstConfigured('DEEPSEEK_MODEL') ?? 'deepseek-v4-flash',
      },
      stats: {
        totalConversations: null,
        selfResolved: null,
        escalated: null,
        resolutionRate: null,
        costTodayUsd: null,
        budgetTodayUsd: this.numberConfig('DEEPSEEK_DAILY_BUDGET_USD', 'AI_DAILY_BUDGET_USD'),
        inputTokens: null,
        outputTokens: null,
        requests: null,
        averageLatencyMs: null,
      },
    }
  }

  private firstConfigured(...keys: string[]): string | null {
    for (const key of keys) {
      const value = this.config.get<string>(key)
      if (value?.trim()) return value
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
