import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { PrismaService } from '../database/prisma.service'
import { Inject } from '@nestjs/common'
import { Redis } from 'ioredis'
import { Client } from 'minio'

interface ComponentStatus {
  status: 'up' | 'down'
  latencyMs: number
}

interface HealthResponse {
  status: 'ok' | 'degraded'
  uptime: number
  timestamp: string
  components: {
    db: ComponentStatus
    redis: ComponentStatus
    minio: ComponentStatus
  }
}

@Controller('healthz')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  async check(@Res() res: Response) {
    const [dbStatus, redisStatus, minioStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMinio(),
    ])

    const allUp = dbStatus.status === 'up'
      && redisStatus.status === 'up'
      && minioStatus.status === 'up'

    const overall = allUp ? 'ok' : 'degraded'
    const httpStatus = allUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE

    return res.status(httpStatus).json({
      status: overall,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      components: {
        db: dbStatus,
        redis: redisStatus,
        minio: minioStatus,
      },
    } as HealthResponse)
  }

  private async checkDatabase(): Promise<ComponentStatus> {
    const start = Date.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { status: 'down', latencyMs: Date.now() - start }
    }
  }

  private async checkRedis(): Promise<ComponentStatus> {
    const start = Date.now()
    try {
      await this.redis.ping()
      return { status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { status: 'down', latencyMs: Date.now() - start }
    }
  }

  private async checkMinio(): Promise<ComponentStatus> {
    const start = Date.now()
    try {
      const client = new Client({
        endPoint: this.config.get<string>('MINIO_ENDPOINT') ?? 'localhost',
        port: this.config.get<number>('MINIO_PORT') ?? 9000,
        useSSL: false,
        accessKey: this.config.get<string>('MINIO_ACCESS_KEY') ?? '',
        secretKey: this.config.get<string>('MINIO_SECRET_KEY') ?? '',
      })
      const bucket = this.config.get<string>('MINIO_BUCKET') ?? 'foodflow'
      await client.bucketExists(bucket)
      return { status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { status: 'down', latencyMs: Date.now() - start }
    }
  }
}
