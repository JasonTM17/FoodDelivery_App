import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { withVerifiedDatabaseTls } from './database-tls'

const FUNCTION_CONNECTION_LIMIT = 1

/**
 * Vercel Function instances each hold their own PrismaClient; an unbounded
 * pool per warm instance multiplies connections across concurrent instances.
 * Bound the pool only in the Function runtime — the long-lived daemon
 * (FOODFLOW_PROCESS_ROLE=worker) and local processes keep the driver default.
 */
export function resolveRuntimeDatabaseUrl(
  url: string | undefined,
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  if (!url) return url
  if (env.VERCEL !== '1' || env.FOODFLOW_PROCESS_ROLE === 'worker') return url
  if (/[?&]connection_limit=\d+/.test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}connection_limit=${FUNCTION_CONNECTION_LIMIT}`
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const url = withVerifiedDatabaseTls(resolveRuntimeDatabaseUrl(process.env.DATABASE_URL), process.env.DB_SSL_CA)
    super(url ? { datasources: { db: { url } } } : {})
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
