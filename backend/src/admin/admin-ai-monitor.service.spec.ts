import { ConfigService } from '@nestjs/config'
import { AdminAiMonitorService } from './admin-ai-monitor.service'

describe('AdminAiMonitorService', () => {
  it('returns an explicit not-configured state instead of fake AI telemetry', () => {
    const service = new AdminAiMonitorService({
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService)

    const overview = service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'not_configured',
      degradedReason: 'DEEPSEEK_NOT_CONFIGURED',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
    })
    expect(overview.stats.totalConversations).toBeNull()
    expect(overview.stats.costTodayUsd).toBeNull()
  })

  it('exposes real DeepSeek configuration while keeping unavailable telemetry null', () => {
    const config = {
      get: jest.fn((key: string) => ({
        DEEPSEEK_API_KEY: 'configured',
        DEEPSEEK_DASHBOARD_URL: 'https://platform.deepseek.com/usage',
        DEEPSEEK_MODEL: 'deepseek-v4-pro',
        DEEPSEEK_DAILY_BUDGET_USD: '5',
      }[key])),
    } as unknown as ConfigService
    const service = new AdminAiMonitorService(config)

    const overview = service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'degraded',
      dashboardUrl: 'https://platform.deepseek.com/usage',
      degradedReason: 'AI_MONITOR_TELEMETRY_NOT_ENABLED',
      provider: 'deepseek',
      model: 'deepseek-v4-pro',
    })
    expect(overview.stats.budgetTodayUsd).toBe(5)
    expect(overview.stats.requests).toBeNull()
  })

  it('reports configured DeepSeek chatbot state without fabricating telemetry', () => {
    const config = {
      get: jest.fn((key: string) => ({
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
    expect(overview.stats.budgetTodayUsd).toBe(7)
    expect(overview.stats.requests).toBeNull()
  })
})
