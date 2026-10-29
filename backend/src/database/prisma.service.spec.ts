import { PrismaService, resolveRuntimeDatabaseUrl } from './prisma.service'

describe('PrismaService', () => {
  it('should be defined', () => {
    const service = new PrismaService()
    expect(service).toBeDefined()
  })
})

describe('resolveRuntimeDatabaseUrl', () => {
  const url = 'postgresql://user:pass@db.example.com:5432/foodflow'

  it('bounds the pool for the Vercel Function runtime', () => {
    expect(resolveRuntimeDatabaseUrl(url, { VERCEL: '1', FOODFLOW_PROCESS_ROLE: 'api' }))
      .toBe(`${url}?connection_limit=1`)
  })

  it('appends the bound alongside existing query parameters', () => {
    const withParams = `${url}?sslmode=require`
    expect(resolveRuntimeDatabaseUrl(withParams, { VERCEL: '1', FOODFLOW_PROCESS_ROLE: 'api' }))
      .toBe(`${withParams}&connection_limit=1`)
  })

  it('preserves an explicit connection_limit already in the URL', () => {
    const bounded = `${url}?connection_limit=5`
    expect(resolveRuntimeDatabaseUrl(bounded, { VERCEL: '1', FOODFLOW_PROCESS_ROLE: 'api' }))
      .toBe(bounded)
  })

  it('leaves the worker daemon unbounded', () => {
    expect(resolveRuntimeDatabaseUrl(url, { VERCEL: '1', FOODFLOW_PROCESS_ROLE: 'worker' }))
      .toBe(url)
  })

  it('leaves local and non-Vercel processes unbounded', () => {
    expect(resolveRuntimeDatabaseUrl(url, { VERCEL: undefined, FOODFLOW_PROCESS_ROLE: 'api' }))
      .toBe(url)
    expect(resolveRuntimeDatabaseUrl(url, {})).toBe(url)
  })

  it('passes through a missing URL unchanged', () => {
    expect(resolveRuntimeDatabaseUrl(undefined, { VERCEL: '1', FOODFLOW_PROCESS_ROLE: 'api' }))
      .toBeUndefined()
  })
})
