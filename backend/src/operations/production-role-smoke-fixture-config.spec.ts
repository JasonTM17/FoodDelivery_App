import {
  PRODUCTION_ROLE_SMOKE_CONFIRMATION,
  PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION,
  assertDisposableProductionSmokeTestTarget,
  assertProductionDatabaseTarget,
  buildProductionSmokeIdentities,
  buildSingleConnectionDatabaseUrl,
  parseProductionRoleSmokeFixtureConfig,
  productionSmokeRestaurantSlug,
} from './production-role-smoke-fixture-config'
import { resolve } from 'node:path'

const validEnv = (): NodeJS.ProcessEnv => ({
  FOODFLOW_PRODUCTION_SMOKE_CONFIRM: PRODUCTION_ROLE_SMOKE_CONFIRMATION,
  FOODFLOW_PRODUCTION_SMOKE_MODE: 'provision',
  FOODFLOW_PRODUCTION_SMOKE_RUN_ID: 'release-0715',
  FOODFLOW_PRODUCTION_SMOKE_PASSWORD: ['Temporary', 'Smoke', 'Pass', '9'].join(''),
  FOODFLOW_PRODUCTION_SMOKE_SIGNAL_PATH: resolve('foodflow-smoke.done'),
  FOODFLOW_PRODUCTION_SMOKE_MAX_SECONDS: '480',
})

describe('production role smoke fixture config', () => {
  it('builds exact invalid-domain identities and a scoped restaurant slug', () => {
    const identities = buildProductionSmokeIdentities('release-0715')

    expect(Object.values(identities)).toHaveLength(4)
    expect(identities.admin.email).toBe('prod-smoke-admin-release-0715@example.invalid')
    expect(identities.restaurant.role).toBe('restaurant')
    expect(productionSmokeRestaurantSlug('release-0715')).toBe('prod-smoke-release-0715')
  })

  it('requires the exact production mutation confirmation', () => {
    expect(() => parseProductionRoleSmokeFixtureConfig({ ...validEnv(), FOODFLOW_PRODUCTION_SMOKE_CONFIRM: 'yes' }))
      .toThrow('does not match')
  })

  it('allows recovery cleanup without password, signal, or timeout', () => {
    const config = parseProductionRoleSmokeFixtureConfig({
      FOODFLOW_PRODUCTION_SMOKE_CONFIRM: PRODUCTION_ROLE_SMOKE_CONFIRMATION,
      FOODFLOW_PRODUCTION_SMOKE_MODE: 'cleanup',
      FOODFLOW_PRODUCTION_SMOKE_RUN_ID: 'release-0715',
    })

    expect(config).toEqual({ mode: 'cleanup', runId: 'release-0715' })
  })

  it('defaults to provision mode for backwards-compatible operator commands', () => {
    const config = parseProductionRoleSmokeFixtureConfig({
      ...validEnv(),
      FOODFLOW_PRODUCTION_SMOKE_MODE: undefined,
    })

    expect(config.mode).toBe('provision')
  })

  it.each([
    ['bad run id', { FOODFLOW_PRODUCTION_SMOKE_RUN_ID: '../unsafe' }],
    ['weak password', { FOODFLOW_PRODUCTION_SMOKE_PASSWORD: 'short' }],
    ['non-ASCII password', { FOODFLOW_PRODUCTION_SMOKE_PASSWORD: 'TemporarySmøkePass9' }],
    ['relative signal', { FOODFLOW_PRODUCTION_SMOKE_SIGNAL_PATH: 'smoke.done' }],
    ['long timeout', { FOODFLOW_PRODUCTION_SMOKE_MAX_SECONDS: '901' }],
    ['unknown mode', { FOODFLOW_PRODUCTION_SMOKE_MODE: 'destroy' }],
  ])('rejects %s', (_name, override) => {
    expect(() => parseProductionRoleSmokeFixtureConfig({ ...validEnv(), ...override })).toThrow()
  })

  it('limits Prisma to one connection without changing the target', () => {
    const result = new URL(buildSingleConnectionDatabaseUrl('postgresql://user:pass@db.example.test:5432/app?sslmode=require'))

    expect(result.hostname).toBe('db.example.test')
    expect(result.searchParams.get('connection_limit')).toBe('1')
    expect(result.searchParams.get('pool_timeout')).toBe('20')
    expect(result.searchParams.get('sslmode')).toBe('require')
  })

  it.each([undefined, '', 'not a URL'])('rejects an unusable database URL: %p', rawUrl => {
    expect(() => buildSingleConnectionDatabaseUrl(rawUrl)).toThrow('DATABASE_URL')
  })

  it.each([
    'postgresql://postgres.projectref@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres@db.projectref.supabase.co:5432/postgres',
  ])('accepts a production database tied to the configured Supabase project', databaseUrl => {
    expect(() => assertProductionDatabaseTarget({
      databaseUrl,
      supabaseUrl: 'https://projectref.supabase.co',
      railwayEnvironmentName: 'production',
    })).not.toThrow()
  })

  it.each([
    ['wrong environment', { railwayEnvironmentName: 'staging' }],
    ['wrong database project', { databaseUrl: 'postgresql://postgres.other@pooler.supabase.com/postgres' }],
    ['wrong database protocol', { databaseUrl: 'https://db.projectref.supabase.co/postgres' }],
    ['wrong database name', { databaseUrl: 'postgresql://postgres.projectref@pooler.supabase.com/other' }],
    ['transaction pool port', { databaseUrl: 'postgresql://postgres.projectref@pooler.supabase.com:6543/postgres' }],
    ['non-public Prisma schema', { databaseUrl: 'postgresql://postgres.projectref@pooler.supabase.com:5432/postgres?schema=shadow' }],
    ['wrong Supabase protocol', { supabaseUrl: 'http://projectref.supabase.co' }],
  ])('rejects target mismatch: %s', (_name, override) => {
    expect(() => assertProductionDatabaseTarget({
      databaseUrl: 'postgresql://postgres.projectref@pooler.supabase.com/postgres',
      supabaseUrl: 'https://projectref.supabase.co',
      railwayEnvironmentName: 'production',
      ...override,
    })).toThrow()
  })

  it('allows destructive fixture integration only on explicitly confirmed loopback', () => {
    expect(() => assertDisposableProductionSmokeTestTarget(
      'postgresql://postgres:password@127.0.0.1:55440/foodflow_role_smoke_integration?schema=public',
      PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION,
    )).not.toThrow()
  })

  it.each([
    ['remote host', 'postgresql://postgres:password@db.projectref.supabase.co/postgres', PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION],
    ['generic loopback database', 'postgresql://postgres:password@localhost:55440/postgres', PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION],
    ['missing confirmation', 'postgresql://postgres:password@localhost:55440/postgres', undefined],
    ['missing URL', undefined, PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION],
  ])('rejects destructive integration target: %s', (_name, databaseUrl, confirmation) => {
    expect(() => assertDisposableProductionSmokeTestTarget(databaseUrl, confirmation)).toThrow()
  })
})
