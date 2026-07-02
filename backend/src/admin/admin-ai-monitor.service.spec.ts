import { NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AdminAiMonitorService } from './admin-ai-monitor.service'

describe('AdminAiMonitorService', () => {
  it('returns an explicit not-configured state instead of fake workflow data', () => {
    const service = new AdminAiMonitorService({
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService)

    const overview = service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'not_configured',
      degradedReason: 'N8N_MONITORING_NOT_CONFIGURED',
      provider: 'n8n',
      model: null,
    })
    expect(overview.workflows).toEqual([])
    expect(overview.executions).toEqual([])
    expect(overview.stats.totalConversations).toBeNull()
    expect(overview.stats.costTodayUsd).toBeNull()
  })

  it('exposes real configured URLs and budgets while keeping unavailable metrics null', () => {
    const config = {
      get: jest.fn((key: string) => ({
        N8N_DASHBOARD_URL: 'https://n8n.foodflow.test',
        N8N_MONITORING_API_URL: 'https://n8n.foodflow.test/api/v1',
        N8N_MONITORING_API_KEY: 'configured',
        GEMINI_DAILY_BUDGET_USD: '5',
      }[key])),
    } as unknown as ConfigService
    const service = new AdminAiMonitorService(config)

    const overview = service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'degraded',
      dashboardUrl: 'https://n8n.foodflow.test',
      degradedReason: 'N8N_MONITORING_ADAPTER_NOT_ENABLED',
      provider: 'n8n',
      model: null,
    })
    expect(overview.stats.budgetTodayUsd).toBe(5)
    expect(overview.stats.requests).toBeNull()
  })

  it('reports configured DeepSeek chatbot state without fabricating telemetry', () => {
    const config = {
      get: jest.fn((key: string) => ({
        AI_CHAT_PROVIDER: 'deepseek',
        DEEPSEEK_API_KEY: 'configured',
        DEEPSEEK_MODEL: 'deepseek-v4-flash',
        DEEPSEEK_DAILY_BUDGET_USD: '7',
      }[key])),
    } as unknown as ConfigService
    const service = new AdminAiMonitorService(config)

    const overview = service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'degraded',
      degradedReason: 'AI_MONITOR_TELEMETRY_NOT_ENABLED',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
    })
    expect(overview.workflows).toEqual([])
    expect(overview.stats.budgetTodayUsd).toBe(7)
    expect(overview.stats.requests).toBeNull()
  })

  it('does not fabricate unknown workflow run details', () => {
    const service = new AdminAiMonitorService({
      get: jest.fn(),
    } as unknown as ConfigService)

    expect(() => service.getRun('run-1')).toThrow(NotFoundException)
  })
})
