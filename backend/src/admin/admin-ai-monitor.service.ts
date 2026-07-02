import { Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type AiMonitorStatus = 'online' | 'degraded' | 'not_configured'

export interface AdminAiMonitorOverview {
  instance: {
    status: AiMonitorStatus
    dashboardUrl: string | null
    degradedReason: string | null
    provider: 'deepseek' | 'n8n'
    model: string | null
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
    const provider = this.chatProvider()
    const dashboardUrl = this.firstConfigured('N8N_DASHBOARD_URL', 'N8N_URL')
    const apiUrl = this.firstConfigured('N8N_MONITORING_API_URL', 'N8N_API_URL')
    const apiKey = this.firstConfigured('N8N_MONITORING_API_KEY', 'N8N_API_KEY')
    const monitoringConfigured = Boolean(apiUrl && apiKey)
    const deepSeekConfigured = Boolean(this.firstConfigured('DEEPSEEK_API_KEY'))
    const configured = provider === 'deepseek' ? deepSeekConfigured : monitoringConfigured

    return {
      instance: {
        status: configured ? 'degraded' : 'not_configured',
        dashboardUrl,
        degradedReason: this.degradedReason(provider, configured),
        provider,
        model: provider === 'deepseek'
          ? this.firstConfigured('DEEPSEEK_MODEL') ?? 'deepseek-v4-flash'
          : null,
      },
      workflows: [],
      executions: [],
      stats: {
        totalConversations: null,
        selfResolved: null,
        escalated: null,
        resolutionRate: null,
        costTodayUsd: null,
        budgetTodayUsd: this.numberConfig('DEEPSEEK_DAILY_BUDGET_USD', 'AI_DAILY_BUDGET_USD', 'GEMINI_DAILY_BUDGET_USD'),
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

  private chatProvider(): 'deepseek' | 'n8n' {
    const configured = this.config.get<string>('AI_CHAT_PROVIDER')?.trim().toLowerCase()
    if (configured === 'deepseek' || configured === 'n8n') return configured
    if (this.firstConfigured('DEEPSEEK_API_KEY')) return 'deepseek'
    return 'n8n'
  }

  private degradedReason(provider: 'deepseek' | 'n8n', configured: boolean): string {
    if (provider === 'deepseek') {
      return configured ? 'AI_MONITOR_TELEMETRY_NOT_ENABLED' : 'DEEPSEEK_NOT_CONFIGURED'
    }

    return configured ? 'N8N_MONITORING_ADAPTER_NOT_ENABLED' : 'N8N_MONITORING_NOT_CONFIGURED'
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
