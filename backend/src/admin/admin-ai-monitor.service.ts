import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type AiMonitorStatus = 'online' | 'degraded' | 'not_configured'

export interface AdminAiMonitorOverview {
  instance: {
    status: AiMonitorStatus
    dashboardUrl: string | null
    degradedReason: string | null
  }
  workflows: AdminAiMonitorWorkflow[]
  executions: AdminAiMonitorExecution[]
  stats: AdminAiMonitorStats
}

export interface AdminAiMonitorWorkflow {
  id: string
  name: string
  status: AiMonitorStatus
  lastRunAt: string | null
  runs: number | null
}

export interface AdminAiMonitorExecution {
  id: string
  workflowName: string
  trigger: string | null
  durationMs: number | null
  status: 'success' | 'error' | 'running'
  startedAt: string | null
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
    const dashboardUrl = this.firstConfigured('N8N_DASHBOARD_URL', 'N8N_URL')
    const apiUrl = this.firstConfigured('N8N_MONITORING_API_URL', 'N8N_API_URL')
    const apiKey = this.firstConfigured('N8N_MONITORING_API_KEY', 'N8N_API_KEY')
    const monitoringConfigured = Boolean(apiUrl && apiKey)

    return {
      instance: {
        status: monitoringConfigured ? 'degraded' : 'not_configured',
        dashboardUrl,
        degradedReason: monitoringConfigured
          ? 'N8N_MONITORING_ADAPTER_NOT_ENABLED'
          : 'N8N_MONITORING_NOT_CONFIGURED',
      },
      workflows: [],
      executions: [],
      stats: {
        totalConversations: null,
        selfResolved: null,
        escalated: null,
        resolutionRate: null,
        costTodayUsd: null,
        budgetTodayUsd: this.numberConfig('GEMINI_DAILY_BUDGET_USD'),
        inputTokens: null,
        outputTokens: null,
        requests: null,
        averageLatencyMs: null,
      },
    }
  }

  getRun(_runId: string): never {
    throw new NotFoundException('AI_MONITOR_RUN_NOT_FOUND')
  }

  private firstConfigured(...keys: string[]): string | null {
    for (const key of keys) {
      const value = this.config.get<string>(key)
      if (value?.trim()) return value
    }
    return null
  }

  private numberConfig(key: string): number | null {
    const raw = this.config.get<string>(key)
    if (!raw?.trim()) return null
    const value = Number(raw)
    return Number.isFinite(value) ? value : null
  }
}
