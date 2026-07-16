import { isAbsolute } from 'node:path'

export const PRODUCTION_ROLE_SMOKE_CONFIRMATION =
  'CREATE_AND_DELETE_EXACT_FOODFLOW_PRODUCTION_SMOKE_IDENTITIES'
export const PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION =
  'DESTROY_DISPOSABLE_LOOPBACK_FOODFLOW_DATABASE'
export const PRODUCTION_ROLE_SMOKE_TEST_DATABASE_PREFIX = 'foodflow_role_smoke_'

export const productionSmokeRoles = ['admin', 'restaurant', 'customer', 'driver'] as const

export type ProductionSmokeRole = (typeof productionSmokeRoles)[number]

export interface ProductionRoleSmokeFixtureBaseConfig {
  runId: string
  mode: 'provision' | 'cleanup'
}

export interface ProductionRoleSmokeProvisionConfig extends ProductionRoleSmokeFixtureBaseConfig {
  mode: 'provision'
  password: string
  signalPath: string
  maxSeconds: number
}

export interface ProductionRoleSmokeCleanupConfig extends ProductionRoleSmokeFixtureBaseConfig {
  mode: 'cleanup'
}

export type ProductionRoleSmokeFixtureConfig =
  | ProductionRoleSmokeProvisionConfig
  | ProductionRoleSmokeCleanupConfig

export interface ProductionSmokeIdentity {
  email: string
  fullName: string
  role: ProductionSmokeRole
}

export interface ProductionDatabaseTarget {
  databaseUrl: string | undefined
  supabaseUrl: string | undefined
  railwayEnvironmentName: string | undefined
}

const runIdPattern = /^[a-z0-9](?:[a-z0-9-]{4,30}[a-z0-9])$/
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\x21-\x7E]{16,72}$/

export function parseProductionRoleSmokeFixtureConfig(
  env: NodeJS.ProcessEnv,
): ProductionRoleSmokeFixtureConfig {
  if (env.FOODFLOW_PRODUCTION_SMOKE_CONFIRM !== PRODUCTION_ROLE_SMOKE_CONFIRMATION) {
    throw new Error('FOODFLOW_PRODUCTION_SMOKE_CONFIRM does not match the required confirmation')
  }

  const runId = env.FOODFLOW_PRODUCTION_SMOKE_RUN_ID?.trim() ?? ''
  if (!runIdPattern.test(runId)) {
    throw new Error('FOODFLOW_PRODUCTION_SMOKE_RUN_ID must be 6-32 lowercase letters, digits, or hyphens')
  }

  const mode = env.FOODFLOW_PRODUCTION_SMOKE_MODE?.trim() || 'provision'
  if (mode !== 'provision' && mode !== 'cleanup') {
    throw new Error('FOODFLOW_PRODUCTION_SMOKE_MODE must be provision or cleanup')
  }
  if (mode === 'cleanup') return { mode, runId }

  const password = env.FOODFLOW_PRODUCTION_SMOKE_PASSWORD ?? ''
  if (!strongPasswordPattern.test(password)) {
    throw new Error('FOODFLOW_PRODUCTION_SMOKE_PASSWORD must be 16-72 printable ASCII chars with upper, lower, and digit')
  }

  const signalPath = env.FOODFLOW_PRODUCTION_SMOKE_SIGNAL_PATH?.trim() ?? ''
  if (!signalPath || !isAbsolute(signalPath)) {
    throw new Error('FOODFLOW_PRODUCTION_SMOKE_SIGNAL_PATH must be an absolute local path')
  }

  const maxSeconds = Number(env.FOODFLOW_PRODUCTION_SMOKE_MAX_SECONDS ?? '480')
  if (!Number.isInteger(maxSeconds) || maxSeconds < 60 || maxSeconds > 900) {
    throw new Error('FOODFLOW_PRODUCTION_SMOKE_MAX_SECONDS must be an integer from 60 through 900')
  }

  return { mode, runId, password, signalPath, maxSeconds }
}

export function buildProductionSmokeIdentities(
  runId: string,
): Record<ProductionSmokeRole, ProductionSmokeIdentity> {
  return Object.fromEntries(
    productionSmokeRoles.map(role => [
      role,
      {
        email: `prod-smoke-${role}-${runId}@example.invalid`,
        fullName: `Production Smoke ${role}`,
        role,
      },
    ]),
  ) as Record<ProductionSmokeRole, ProductionSmokeIdentity>
}

export function productionSmokeRestaurantSlug(runId: string): string {
  return `prod-smoke-${runId}`
}

export function buildSingleConnectionDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) throw new Error('DATABASE_URL is required')
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('DATABASE_URL must be a valid URL')
  }
  url.searchParams.set('connection_limit', '1')
  url.searchParams.set('pool_timeout', '20')
  return url.toString()
}

export function assertProductionDatabaseTarget(target: ProductionDatabaseTarget): void {
  if (target.railwayEnvironmentName !== 'production') {
    throw new Error('RAILWAY_ENVIRONMENT_NAME must be production')
  }

  const databaseUrl = parseRequiredUrl(target.databaseUrl, 'DATABASE_URL')
  if (databaseUrl.protocol !== 'postgres:' && databaseUrl.protocol !== 'postgresql:') {
    throw new Error('DATABASE_URL must use PostgreSQL')
  }
  if (decodeUrlComponent(databaseUrl.pathname.replace(/^\//, ''), 'DATABASE_URL database name') !== 'postgres') {
    throw new Error('DATABASE_URL must target the Supabase postgres database')
  }
  const prismaSchema = databaseUrl.searchParams.get('schema')
  if (prismaSchema !== null && prismaSchema !== 'public') {
    throw new Error('DATABASE_URL must target the public Prisma schema')
  }

  const supabaseUrl = parseRequiredUrl(target.supabaseUrl, 'SUPABASE_URL')
  if (supabaseUrl.protocol !== 'https:') throw new Error('SUPABASE_URL must use HTTPS')
  const projectMatch = /^([a-z0-9]+)\.supabase\.co$/.exec(supabaseUrl.hostname)
  if (!projectMatch) throw new Error('SUPABASE_URL must identify a Supabase project')

  const projectRef = projectMatch[1]
  const directHostMatches = databaseUrl.hostname === `db.${projectRef}.supabase.co`
  const databaseUsername = decodeUrlComponent(databaseUrl.username, 'DATABASE_URL username')
  const poolerMatches = databaseUrl.hostname.endsWith('.pooler.supabase.com')
    && databaseUsername.endsWith(`.${projectRef}`)
  if (!directHostMatches && !poolerMatches) {
    throw new Error('DATABASE_URL and SUPABASE_URL do not identify the same Supabase project')
  }
  if (databaseUrl.port && databaseUrl.port !== '5432') {
    throw new Error('DATABASE_URL must use a direct or session-pool connection on port 5432')
  }
}

export function assertDisposableProductionSmokeTestTarget(
  rawDatabaseUrl: string | undefined,
  confirmation: string | undefined,
): void {
  if (!rawDatabaseUrl || confirmation !== PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION) {
    throw new Error(
      `Fixture integration requires PRODUCTION_ROLE_SMOKE_TEST_CONFIRM=${PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION}`,
    )
  }
  const url = parseRequiredUrl(rawDatabaseUrl, 'PRODUCTION_ROLE_SMOKE_TEST_DATABASE_URL')
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Fixture integration database must use a disposable loopback PostgreSQL host')
  }
  const databaseName = decodeUrlComponent(
    url.pathname.replace(/^\//, ''),
    'PRODUCTION_ROLE_SMOKE_TEST_DATABASE_URL database name',
  )
  if (!databaseName.startsWith(PRODUCTION_ROLE_SMOKE_TEST_DATABASE_PREFIX)) {
    throw new Error(
      `Fixture integration database name must start with ${PRODUCTION_ROLE_SMOKE_TEST_DATABASE_PREFIX}`,
    )
  }
}

function parseRequiredUrl(rawUrl: string | undefined, name: string): URL {
  if (!rawUrl) throw new Error(`${name} is required`)
  try {
    return new URL(rawUrl)
  } catch {
    throw new Error(`${name} must be a valid URL`)
  }
}

function decodeUrlComponent(value: string, name: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    throw new Error(`${name} encoding is invalid`)
  }
}
