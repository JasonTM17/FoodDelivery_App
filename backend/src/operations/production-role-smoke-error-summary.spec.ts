import { productionRoleSmokeErrorSummary } from './production-role-smoke-error-summary'

describe('productionRoleSmokeErrorSummary', () => {
  it('keeps allow-listed operator context', () => {
    expect(productionRoleSmokeErrorSummary(
      new Error('RAILWAY_ENVIRONMENT_NAME must be production'),
      'Unknown failure',
    )).toBe('RAILWAY_ENVIRONMENT_NAME must be production')

    expect(productionRoleSmokeErrorSummary(
      new Error('Production smoke fixture has unexpected dependent rows'),
      'Unknown failure',
    )).toBe('Production smoke fixture has unexpected dependent rows')

    expect(productionRoleSmokeErrorSummary(
      new Error('Active production smoke fixture topology is incomplete'),
      'Unknown failure',
    )).toBe('Active production smoke fixture topology is incomplete')
  })

  it.each([
    '{"password":"json-secret"}',
    'SUPABASE_SERVICE_ROLE_KEY=service-secret',
    'password = "spaced secret"',
    'postgresql://operator:database-password@db.project-ref.supabase.co:5432/postgres?schema=public',
    'RAILWAY_ENVIRONMENT_NAME must be production secret=appended-secret',
  ])('fails closed for an untrusted message: %s', message => {
    expect(productionRoleSmokeErrorSummary(
      new Error(message),
      'Unknown failure',
    )).toBe('Unknown failure')
  })

  it('does not expose an untrusted Error name', () => {
    const error = new Error('unknown failure')
    error.name = 'password=name-secret'

    expect(productionRoleSmokeErrorSummary(error, 'Unknown failure')).toBe('Unknown failure')
  })

  it('retains only a validated Prisma-style error code for unknown database failures', () => {
    const error = Object.assign(new Error('database URL and row details'), { code: 'P1001' })

    expect(productionRoleSmokeErrorSummary(error, 'Unknown failure'))
      .toBe('Unknown failure code=P1001')
  })

  it('rejects arbitrary error codes and non-Error failures', () => {
    const error = Object.assign(new Error('failure'), { code: 'password=secret' })

    expect(productionRoleSmokeErrorSummary(error, 'Unknown failure')).toBe('Unknown failure')
    expect(productionRoleSmokeErrorSummary('failure', 'Unknown failure')).toBe('Unknown failure')
  })
})
