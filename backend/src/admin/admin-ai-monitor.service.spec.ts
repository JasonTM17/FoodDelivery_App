import { ConfigService } from '@nestjs/config'
import { SupportChannel } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { AdminAiMonitorService } from './admin-ai-monitor.service'

describe('AdminAiMonitorService', () => {
  const config = {
    get: jest.fn(),
  }
  const prisma = {
    chatSession: {
      findMany: jest.fn(),
    },
    aiSupportTicket: {
      findMany: jest.fn(),
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
  })

  it('returns an explicit not-configured state instead of fake AI telemetry', async () => {
    const overview = await service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'not_configured',
      degradedReason: 'DEEPSEEK_NOT_CONFIGURED',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
    })
    expect(overview.stats.totalConversations).toBe(0)
    expect(overview.stats.selfResolved).toBe(0)
    expect(overview.stats.escalated).toBe(0)
    expect(overview.stats.costTodayUsd).toBeNull()
  })

  it('exposes configured DeepSeek with real conversation stats from the database', async () => {
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
    ])

    const overview = await service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'online',
      dashboardUrl: 'https://platform.deepseek.com/usage',
      degradedReason: null,
      provider: 'deepseek',
      model: 'deepseek-v4-pro',
    })
    expect(prisma.chatSession.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ type: 'ai_support' }),
    }))
    expect(prisma.aiSupportTicket.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { channel: SupportChannel.ai_chat },
    }))
    expect(overview.stats.totalConversations).toBe(2)
    expect(overview.stats.selfResolved).toBe(1)
    expect(overview.stats.escalated).toBe(1)
    expect(overview.stats.resolutionRate).toBe(50)
    expect(overview.stats.budgetTodayUsd).toBe(5)
    expect(overview.stats.requests).toBeNull()
  })

  it('reports degraded only when configured provider stats cannot be read', async () => {
    config.get.mockImplementation((key: string) => ({
      DEEPSEEK_API_KEY: 'configured',
      DEEPSEEK_MODEL: 'deepseek-v4-flash',
      DEEPSEEK_DAILY_BUDGET_USD: '7',
    })[key])
    prisma.chatSession.findMany.mockRejectedValue(new Error('database unavailable'))

    const overview = await service.getOverview()

    expect(overview.instance).toMatchObject({
      status: 'degraded',
      degradedReason: 'AI_MONITOR_STATS_UNAVAILABLE',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
    })
    expect(overview.stats.totalConversations).toBeNull()
    expect(overview.stats.budgetTodayUsd).toBe(7)
    expect(overview.stats.requests).toBeNull()
  })
})
