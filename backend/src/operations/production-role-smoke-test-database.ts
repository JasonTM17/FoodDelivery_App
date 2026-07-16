import { PrismaClient } from '@prisma/client'
import { PRODUCTION_ROLE_SMOKE_TEST_DATABASE_PREFIX } from './production-role-smoke-fixture-config'

export const PRODUCTION_ROLE_SMOKE_TEST_DATABASE_COMMENT =
  'FOODFLOW_DISPOSABLE_PRODUCTION_ROLE_SMOKE_TEST_DATABASE'

interface DatabaseIdentityRow {
  database_name: string
  database_comment: string | null
}

/**
 * URL loopback checks cannot distinguish a local disposable PostgreSQL server
 * from a tunnel to a remote database. Require server-side disposable evidence.
 */
export async function assertDisposableProductionSmokeDatabaseIdentity(
  prisma: PrismaClient,
): Promise<void> {
  const rows = await prisma.$queryRaw<DatabaseIdentityRow[]>`
    SELECT
      current_database() AS database_name,
      shobj_description(oid, 'pg_database') AS database_comment
    FROM pg_database
    WHERE datname = current_database()
  `
  const identity = rows[0]
  if (!identity
    || !identity.database_name.startsWith(PRODUCTION_ROLE_SMOKE_TEST_DATABASE_PREFIX)
    || identity.database_comment !== PRODUCTION_ROLE_SMOKE_TEST_DATABASE_COMMENT) {
    throw new Error('Fixture integration database lacks the required server-side disposable marker')
  }
}
