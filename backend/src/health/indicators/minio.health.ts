import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'
import { resolveMinioRuntimeConfig } from '../../common/storage/minio-config'

export interface HealthIndicatorResult {
  status: 'up' | 'down'
  latencyMs: number
}

@Injectable()
export class MinioHealthIndicator {
  constructor(private readonly config: ConfigService) {}

  async check(): Promise<HealthIndicatorResult> {
    const start = Date.now()
    try {
      const minio = resolveMinioRuntimeConfig(this.config)
      const client = new Client(minio.client)
      await client.bucketExists(minio.bucket)
      return { status: 'up', latencyMs: Date.now() - start }
    } catch {
      return { status: 'down', latencyMs: Date.now() - start }
    }
  }
}
