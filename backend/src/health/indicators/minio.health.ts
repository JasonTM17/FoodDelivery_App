import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from 'minio'

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
