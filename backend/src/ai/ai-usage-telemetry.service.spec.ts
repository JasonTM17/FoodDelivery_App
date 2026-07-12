import { AiUsageOutcome } from '@prisma/client'
import { AiUsageTelemetryService } from './ai-usage-telemetry.service'

describe('AiUsageTelemetryService', () => {
  const prisma = {
    aiUsageEvent: {
      create: jest.fn(),
    },
  }
  const service = new AiUsageTelemetryService(prisma as never)

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.aiUsageEvent.create.mockResolvedValue({})
  })

  it('persists only bounded, factual provider telemetry', async () => {
    await service.record({
      sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      outcome: AiUsageOutcome.succeeded,
      inputTokens: 321.8,
      outputTokens: 88,
      latencyMs: 214.7,
    })

    expect(prisma.aiUsageEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        inputTokens: 321,
        outputTokens: 88,
        latencyMs: 214,
      }),
    })
  })

  it('does not fabricate relations or token values for malformed input', async () => {
    await service.record({
      sessionId: 'browser-session',
      userId: 'user-1',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      outcome: AiUsageOutcome.failed,
      inputTokens: Number.NaN,
      outputTokens: -1,
      latencyMs: -4,
      errorCode: 'DEEPSEEK_ERROR_503',
    })

    expect(prisma.aiUsageEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: null,
        userId: null,
        inputTokens: null,
        outputTokens: null,
        latencyMs: 0,
        errorCode: 'DEEPSEEK_ERROR_503',
      }),
    })
  })

  it('contains telemetry persistence failures', async () => {
    prisma.aiUsageEvent.create.mockRejectedValueOnce(new Error('database unavailable'))

    await expect(service.record({
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      outcome: AiUsageOutcome.failed,
      latencyMs: 1,
    })).resolves.toBeUndefined()
  })
})
