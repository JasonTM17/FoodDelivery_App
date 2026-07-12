import { ConfigService } from '@nestjs/config'
import { AiUsageOutcome, SupportChannel } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { AdminAiMonitorService } from './admin-ai-monitor.service'

describe('AdminAiMonitorService', () => {
  const config = { get: jest.fn() }
  const prisma = {
    chatSession: { findMany: jest.fn() },
    aiSupportTicket: { findMany: jest.fn() },
    aiUsageEvent: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  }
  const service = new AdminAiMonitorService(
    config as unknown as ConfigService,
    prisma as unknown as PrismaService,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    config.get.mockReturnValue(undefined)
    prisma.chatSession.findMany.mockResolvedValue([])
    prisma.aiSupportTicket.findMany.mockResolvedValue([])
    prisma.aiUsageEvent.aggregate.mockResolvedValue({
      _sum: { inputTokens: null, outputTokens: null },
      _avg: { latencyMs: null },
      _count: { _all: 0 },
    })
    prisma.aiUsageEvent.count.mockResolvedValue(0)
    prisma.aiUsageEvent.findFirst.mockResolvedValue(null)
  })

  it('returns an explicit not-configured state without fabricating provider usage', async () => {
    const overview = await service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'not_configured',
      degradedReason: 'DEEPSEEK_NOT_CONFIGURED',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      telemetry: { status: 'awaiting_requests', lastRequestAt: null },
    })
    expect(overview.stats.totalConversations).toBe(0)
    expect(overview.stats.costTodayUsd).toBeNull()
    expect(overview.stats.requests).toBe(0)
    expect(overview.stats.inputTokens).toBeNull()
  })

  it('exposes configured DeepSeek with database-backed conversation and provider telemetry', async () => {
    const latestRequest = new Date('2026-07-10T05:00:00.000Z')
    const latestSuccess = new Date('2026-07-10T04:59:00.000Z')
    config.get.mockImplementation((key: string) => ({
      DEEPSEEK_API_KEY: 'configured',
      DEEPSEEK_DASHBOARD_URL: 'https://platform.deepseek.com/usage',
      DEEPSEEK_MODEL: 'deepseek-v4-pro',
      DEEPSEEK_DAILY_BUDGET_USD: '5',
    })[key])
    prisma.chatSession.findMany.mockResolvedValue([
      { id: 'session-self-resolved' },
      { id: 'session-escalated' },
    ])
    prisma.aiSupportTicket.findMany.mockResolvedValue([
      { tags: ['ai_session:session-escalated'] },
      { tags: ['ai_session:session-escalated', 'issue:follow-up'] },
    ])
    prisma.aiUsageEvent.aggregate.mockResolvedValue({
      _sum: { inputTokens: 1400, outputTokens: 420 },
      _avg: { latencyMs: 208.4 },
      _count: { _all: 7 },
    })
    prisma.aiUsageEvent.findFirst
      .mockResolvedValueOnce({ createdAt: latestRequest, outcome: AiUsageOutcome.succeeded, errorCode: null })
      .mockResolvedValueOnce({ createdAt: latestSuccess })

    const overview = await service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'online',
      dashboardUrl: 'https://platform.deepseek.com/usage',
      degradedReason: null,
      provider: 'deepseek',
      model: 'deepseek-v4-pro',
      telemetry: {
        status: 'live',
        lastRequestAt: latestRequest.toISOString(),
        lastSuccessfulRequestAt: latestSuccess.toISOString(),
        lastFailureCode: null,
      },
    })
    expect(prisma.aiSupportTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { channel: SupportChannel.ai_chat },
    }))
    expect(overview.stats).toMatchObject({
      totalConversations: 2,
      selfResolved: 1,
      escalated: 1,
      resolutionRate: 50,
      budgetTodayUsd: 5,
      inputTokens: 1400,
      outputTokens: 420,
      requests: 7,
      failedRequests: 0,
      averageLatencyMs: 208,
    })
  })

  it('surfaces the latest real provider failure instead of declaring the instance online', async () => {
    config.get.mockImplementation((key: string) => ({ DEEPSEEK_API_KEY: 'configured' })[key])
    prisma.aiUsageEvent.aggregate.mockResolvedValue({
      _sum: { inputTokens: null, outputTokens: null },
      _avg: { latencyMs: 950 },
      _count: { _all: 1 },
    })
    prisma.aiUsageEvent.count.mockResolvedValue(1)
    prisma.aiUsageEvent.findFirst
      .mockResolvedValueOnce({ createdAt: new Date('2026-07-10T05:10:00.000Z'), outcome: AiUsageOutcome.failed, errorCode: 'DEEPSEEK_ERROR_503' })
      .mockResolvedValueOnce(null)

    const overview = await service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'degraded',
      degradedReason: 'DEEPSEEK_ERROR_503',
      telemetry: { status: 'live', lastFailureCode: 'DEEPSEEK_ERROR_503' },
    })
    expect(overview.stats.failedRequests).toBe(1)
  })

  it('reports telemetry storage failure without inventing zeroes', async () => {
    config.get.mockImplementation((key: string) => ({ DEEPSEEK_API_KEY: 'configured' })[key])
    prisma.aiUsageEvent.aggregate.mockRejectedValueOnce(new Error('database unavailable'))

    const overview = await service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'degraded',
      degradedReason: 'AI_MONITOR_TELEMETRY_UNAVAILABLE',
      telemetry: { status: 'unavailable' },
    })
    expect(overview.stats.requests).toBeNull()
    expect(overview.stats.inputTokens).toBeNull()
  })
})
