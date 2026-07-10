import { Injectable, Logger } from '@nestjs/common'
import { AiUsageOutcome } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'

export interface AiUsageTelemetryInput {
  sessionId?: string | null
  userId?: string | null
  provider: string
  model: string
  outcome: AiUsageOutcome
  inputTokens?: number | null
  outputTokens?: number | null
  latencyMs: number
  errorCode?: string | null
}

/**
 * Persists observability from a real provider invocation. Telemetry must never
 * change the result of a customer request, so a database outage is logged and
 * contained instead of creating an invented metric or response.
 */
@Injectable()
export class AiUsageTelemetryService {
  private readonly logger = new Logger(AiUsageTelemetryService.name)

  constructor(private readonly prisma: PrismaService) {}

  async record(input: AiUsageTelemetryInput): Promise<void> {
    try {
      await this.prisma.aiUsageEvent.create({
        data: {
          sessionId: isUuid(input.sessionId) ? input.sessionId : null,
          userId: isUuid(input.userId) ? input.userId : null,
          provider: input.provider,
          model: input.model,
          outcome: input.outcome,
          inputTokens: asNonNegativeInteger(input.inputTokens),
          outputTokens: asNonNegativeInteger(input.outputTokens),
          latencyMs: Math.max(0, Math.trunc(input.latencyMs)),
          errorCode: input.errorCode?.slice(0, 128) ?? null,
        },
      })
    } catch {
      this.logger.warn('AI usage telemetry write failed')
    }
  }
}

function asNonNegativeInteger(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value < 0) return null
  return Math.trunc(value)
}

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
}
