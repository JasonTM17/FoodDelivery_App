import { Prisma, PrismaClient } from '@prisma/client'

const advisoryLockName = 'foodflow-production-role-smoke-fixture'

export async function acquireProductionRoleSmokeLease(
  prisma: PrismaClient,
  expectedDatabaseName = 'postgres',
): Promise<number> {
  const [result] = await prisma.$queryRaw<Array<{
    acquired: boolean
    backendPid: number
    databaseName: string
    schemaName: string
  }>>`
    SELECT
      CASE
        WHEN current_database() = ${expectedDatabaseName} AND current_schema() = 'public'
          THEN pg_try_advisory_lock(hashtext(${advisoryLockName}))
        ELSE FALSE
      END AS acquired,
      pg_backend_pid() AS "backendPid",
      current_database() AS "databaseName",
      current_schema() AS "schemaName"
  `
  if (result?.databaseName !== expectedDatabaseName || result.schemaName !== 'public') {
    throw new Error(`Production role smoke database session must use ${expectedDatabaseName}.public`)
  }
  if (!result?.acquired) {
    throw new Error('Another production role smoke fixture controller owns the database lease')
  }
  return result.backendPid
}

export async function assertProductionRoleSmokeLease(
  prisma: PrismaClient | Prisma.TransactionClient,
  expectedBackendPid: number,
  expectedDatabaseName = 'postgres',
): Promise<void> {
  const [result] = await prisma.$queryRaw<Array<{
    backendPid: number
    databaseName: string
    schemaName: string
  }>>`
    SELECT
      pg_backend_pid() AS "backendPid",
      current_database() AS "databaseName",
      current_schema() AS "schemaName"
  `
  if (result?.backendPid !== expectedBackendPid
    || result.databaseName !== expectedDatabaseName
    || result.schemaName !== 'public') {
    throw new Error('Production role smoke database lease connection changed')
  }
}

export async function releaseProductionRoleSmokeLease(
  prisma: PrismaClient,
  expectedBackendPid: number,
): Promise<void> {
  const [result] = await prisma.$queryRaw<Array<{ released: boolean; backendPid: number }>>`
    SELECT
      pg_advisory_unlock(hashtext(${advisoryLockName})) AS released,
      pg_backend_pid() AS "backendPid"
  `
  if (!result?.released || result.backendPid !== expectedBackendPid) {
    throw new Error('Production role smoke database lease was not released by its owner connection')
  }
}
