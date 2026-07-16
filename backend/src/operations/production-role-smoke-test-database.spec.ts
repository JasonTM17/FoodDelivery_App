import { PrismaClient } from '@prisma/client'
import {
  PRODUCTION_ROLE_SMOKE_TEST_DATABASE_COMMENT,
  assertDisposableProductionSmokeDatabaseIdentity,
} from './production-role-smoke-test-database'

describe('production role smoke disposable database identity', () => {
  it('accepts only a server-marked disposable database', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{
        database_name: 'foodflow_role_smoke_integration',
        database_comment: PRODUCTION_ROLE_SMOKE_TEST_DATABASE_COMMENT,
      }]),
    } as unknown as PrismaClient

    await expect(assertDisposableProductionSmokeDatabaseIdentity(prisma)).resolves.toBeUndefined()
  })

  it.each([
    ['missing marker', 'foodflow_role_smoke_integration', null],
    ['wrong marker', 'foodflow_role_smoke_integration', 'not-disposable'],
    ['generic database', 'postgres', PRODUCTION_ROLE_SMOKE_TEST_DATABASE_COMMENT],
  ])('rejects %s', async (_name, databaseName, databaseComment) => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{
        database_name: databaseName,
        database_comment: databaseComment,
      }]),
    } as unknown as PrismaClient

    await expect(assertDisposableProductionSmokeDatabaseIdentity(prisma))
      .rejects.toThrow('server-side disposable marker')
  })
})
