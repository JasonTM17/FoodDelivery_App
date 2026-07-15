import { Controller, Get, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Response } from 'express'
import { PrismaService } from '../database/prisma.service'
import { Inject } from '@nestjs/common'
import { Redis } from 'ioredis'
import { Client } from 'minio'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseStorageAdminKey } from '../common/supabase/supabase-config'
import { resolveMinioRuntimeConfig } from '../common/storage/minio-config'
import {
  type ComponentStatus,
  type HealthComponents,
  type StorageComponentStatus,
  resolveHealthOutcome,
  resolveReadinessOutcome,
} from './health-policy'

interface HealthResponse {
  status: 'ok' | 'degraded'
  revision: string | null
  uptime: number
  timestamp: string
  components: HealthComponents
}

interface ReadinessResponse {
  status: 'ready' | 'not_ready'
  ready: boolean
  revision: string | null
  timestamp: string
  components: HealthComponents
}

@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get('healthz')
  async check(@Res() res: Response) {
    const components = await this.checkComponents()
    const { status: overall, httpStatus } = resolveHealthOutcome(components)

    return res.status(httpStatus).json({
      status: overall,
      revision: this.getBuildRevision(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      components,
    } as HealthResponse)
  }

  @Get('readyz')
  async readiness(@Res() res: Response) {
    const components = await this.checkComponents()
    const outcome = resolveReadinessOutcome(components)

    return res.status(outcome.httpStatus).json({
      status: outcome.status,
      ready: outcome.ready,
      revision: this.getBuildRevision(),
      timestamp: new Date().toISOString(),
      components,
    } as ReadinessResponse)
  }

  private async checkComponents(): Promise<HealthComponents> {
    const [db, redis, storage] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
    ])
    return { db, redis, storage }
  }

  private getBuildRevision(): string | null {
    const revision = this.config.get<string>('BUILD_SHA')?.trim()
      || this.config.get<string>('RAILWAY_GIT_COMMIT_SHA')?.trim()
    return revision || null
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
    const provider =
      this.config.get<string>('STORAGE_PROVIDER') === 'supabase'
        ? 'supabase'
        : 'minio'
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
      const serviceRoleKey = getSupabaseStorageAdminKey(this.config)
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
    const stringValue =
      value === undefined || value === null ? '' : String(value).trim()
    if (!stringValue) throw new Error(`${key} is required`)
    return stringValue
  }
}
