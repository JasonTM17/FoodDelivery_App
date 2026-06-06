import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'

export interface HealthIndicatorResult {
  status: 'up' | 'down'
  latencyMs: number
}

@Injectable()
export class DatabaseHealthIndicator {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthIndicatorResult> {
    const start = Date.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { status: 'down', latencyMs: Date.now() - start }
    }
  }
}
