import { Controller, Get, Inject, HttpStatus, Res } from '@nestjs/common'
import { Response } from 'express'
import { PrismaService } from '../database/prisma.service'
import { Redis } from 'ioredis'

interface ComponentStatus {
  status: 'up' | 'down'
  latencyMs?: number
}

interface HealthResponse {
  status: 'ok' | 'degraded'
  uptime: number
  timestamp: string
  components: {
    db: ComponentStatus
    redis: ComponentStatus
  }
}

@Controller('healthz')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  async check(@Res() res: Response) {
    const [dbStatus, redisStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ])

    const overall = dbStatus.status === 'up' && redisStatus.status === 'up'
      ? 'ok'
      : 'degraded'

    const httpStatus = overall === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE

    return res.status(httpStatus).json({
      status: overall,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      components: {
        db: dbStatus,
        redis: redisStatus,
      },
    } as HealthResponse)
  }

  private async checkDatabase(): Promise<ComponentStatus> {
    const start = Date.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { status: 'down' }
    }
  }

  private async checkRedis(): Promise<ComponentStatus> {
    const start = Date.now()
    try {
      await this.redis.ping()
      return { status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { status: 'down' }
    }
  }
}
