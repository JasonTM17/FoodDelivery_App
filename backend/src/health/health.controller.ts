import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { PrismaService } from '../database/prisma.service'
import { Inject } from '@nestjs/common'
import { Redis } from 'ioredis'
import { Client } from 'minio'
import { createClient } from '@supabase/supabase-js'
import { resolveMinioRuntimeConfig } from '../common/storage/minio-config'

interface ComponentStatus {
  status: 'up' | 'down'
  latencyMs: number
}

interface StorageComponentStatus extends ComponentStatus {
  provider: 'minio' | 'supabase'
}

interface HealthResponse {
  status: 'ok' | 'degraded'
  uptime: number
  timestamp: string
  components: {
    db: ComponentStatus
    redis: ComponentStatus
    storage: StorageComponentStatus
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
    const [dbStatus, redisStatus, storageStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ])

    const allUp = dbStatus.status === 'up'
      && redisStatus.status === 'up'
      && storageStatus.status === 'up'

    const overall = allUp ? 'ok' : 'degraded'
    const httpStatus = allUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE

    return res.status(httpStatus).json({
      status: overall,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      components: {
        db: dbStatus,
        redis: redisStatus,
        storage: storageStatus,
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

  private async checkStorage(): Promise<StorageComponentStatus> {
    const provider = this.config.get<string>('STORAGE_PROVIDER') === 'supabase' ? 'supabase' : 'minio'
    if (provider === 'supabase') {
      return this.checkSupabaseStorage()
    }
    return this.checkMinio()
  }

  private async checkMinio(): Promise<StorageComponentStatus> {
    const start = Date.now()
    try {
      const minio = resolveMinioRuntimeConfig(this.config)
      const client = new Client(minio.client)
      await client.bucketExists(minio.bucket)
      return { provider: 'minio', status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { provider: 'minio', status: 'down', latencyMs: Date.now() - start }
    }
  }

  private async checkSupabaseStorage(): Promise<StorageComponentStatus> {
    const start = Date.now()
    try {
      const supabaseUrl = this.requireStringConfig('SUPABASE_URL')
      const serviceRoleKey = this.requireStringConfig('SUPABASE_SERVICE_ROLE_KEY')
      const bucket = this.requireStringConfig('SUPABASE_STORAGE_BUCKET')
      const client = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { error } = await client.storage.getBucket(bucket)
      if (error) throw error
      return { provider: 'supabase', status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { provider: 'supabase', status: 'down', latencyMs: Date.now() - start }
    }
  }

  private requireStringConfig(key: string): string {
    const value = this.config.get<string | number>(key)
    const stringValue = value === undefined || value === null ? '' : String(value).trim()
    if (!stringValue) throw new Error(`${key} is required`)
    return stringValue
  }
}
