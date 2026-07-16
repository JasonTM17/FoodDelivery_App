const safeOperatorMessages = new Set([
  'Active production smoke fixture topology is incomplete',
  'Another production role smoke fixture controller owns the database lease',
  'Cleanup signal already exists; remove it before provisioning',
  'DATABASE_URL and SUPABASE_URL do not identify the same Supabase project',
  'DATABASE_URL is required',
  'DATABASE_URL must be a valid URL',
  'DATABASE_URL must target the public Prisma schema',
  'DATABASE_URL must target the Supabase postgres database',
  'DATABASE_URL must use a direct or session-pool connection on port 5432',
  'DATABASE_URL must use PostgreSQL',
  'Deleted production smoke lifecycle still has fixture rows',
  'Exact production smoke lifecycle does not exist',
  'Exact production smoke restaurant namespace is not owned by this fixture',
  'Exact production smoke user namespace is not owned by this fixture',
  'FOODFLOW_PRODUCTION_SMOKE_CONFIRM does not match the required confirmation',
  'FOODFLOW_PRODUCTION_SMOKE_MAX_SECONDS must be an integer from 60 through 900',
  'FOODFLOW_PRODUCTION_SMOKE_MODE must be provision or cleanup',
  'FOODFLOW_PRODUCTION_SMOKE_PASSWORD must be 16-72 printable ASCII chars with upper, lower, and digit',
  'FOODFLOW_PRODUCTION_SMOKE_RUN_ID must be 6-32 lowercase letters, digits, or hyphens',
  'FOODFLOW_PRODUCTION_SMOKE_SIGNAL_PATH must be an absolute local path',
  'Production role smoke cleanup result is unavailable',
  'Production role smoke database lease connection changed',
  'Production role smoke database lease is unavailable',
  'Production role smoke database lease was not released by its owner connection',
  'Production role smoke database session must use postgres.public',
  'Production role smoke requires zero users, restaurants, orders, GPS rows, and unfinished smoke runs',
  'Production smoke fixture cleanup verification failed',
  'Production smoke fixture has unexpected dependent rows',
  'Production smoke fixture transaction verification failed',
  'Production smoke lifecycle cleanup verification failed',
  'Production smoke lifecycle deletion transition failed',
  'Production smoke lifecycle finalization failed',
  'Production smoke lifecycle is not ready for finalization',
  'Production smoke lifecycle ownership changed before finalization',
  'Production smoke lifecycle slug does not match the requested run',
  'Production smoke lifecycle state is invalid',
  'Production smoke namespace has no durable ownership record',
  'Production smoke ownership changed during cleanup',
  'Production smoke restaurant namespace is ambiguous',
  'Production smoke restaurant ownership topology is incomplete',
  'Production smoke restaurant ownership topology is invalid',
  'Provision config required',
  'Provision deadline required',
  'Provisioning failed and automatic reconciliation did not complete',
  'RAILWAY_ENVIRONMENT_NAME must be production',
  'SUPABASE_URL is required',
  'SUPABASE_URL must be a valid URL',
  'SUPABASE_URL must identify a Supabase project',
  'SUPABASE_URL must use HTTPS',
  'Unexpected production smoke lifecycle exists after empty reconciliation',
])

const safeDatabaseErrorCodePattern = /^P\d{4}$/

export function productionRoleSmokeErrorSummary(
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof Error)) return fallback
  if (safeOperatorMessages.has(error.message)) return error.message

  const code = 'code' in error && typeof error.code === 'string'
    && safeDatabaseErrorCodePattern.test(error.code)
    ? error.code
    : null
  return code ? `${fallback} code=${code}` : fallback
}
