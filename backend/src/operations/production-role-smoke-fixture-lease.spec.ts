import { PrismaClient } from '@prisma/client'
import {
  acquireProductionRoleSmokeLease,
  assertProductionRoleSmokeLease,
  releaseProductionRoleSmokeLease,
} from './production-role-smoke-fixture-lease'

function prismaReturning(rows: unknown[]): PrismaClient {
  return {
    $queryRaw: jest.fn().mockResolvedValue(rows),
  } as unknown as PrismaClient
}

describe('production role smoke database lease', () => {
  it('returns the backend PID only for postgres.public lease ownership', async () => {
    const prisma = prismaReturning([{
      acquired: true,
      backendPid: 321,
      databaseName: 'postgres',
      schemaName: 'public',
    }])

    await expect(acquireProductionRoleSmokeLease(prisma)).resolves.toBe(321)
  })

  it('rejects a live session outside postgres.public before accepting the lease', async () => {
    const prisma = prismaReturning([{
      acquired: false,
      backendPid: 321,
      databaseName: 'postgres',
      schemaName: 'shadow',
    }])

    await expect(acquireProductionRoleSmokeLease(prisma)).rejects.toThrow('postgres.public')
  })

  it('rejects lease contention', async () => {
    const prisma = prismaReturning([{
      acquired: false,
      backendPid: 321,
      databaseName: 'postgres',
      schemaName: 'public',
    }])

    await expect(acquireProductionRoleSmokeLease(prisma)).rejects.toThrow('owns the database lease')
  })

  it('fails closed when a heartbeat runs on a replacement backend', async () => {
    const prisma = prismaReturning([{
      backendPid: 654,
      databaseName: 'postgres',
      schemaName: 'public',
    }])

    await expect(assertProductionRoleSmokeLease(prisma, 321)).rejects.toThrow('connection changed')
  })

  it('requires unlock confirmation from the original backend', async () => {
    const prisma = prismaReturning([{ released: false, backendPid: 654 }])

    await expect(releaseProductionRoleSmokeLease(prisma, 321)).rejects.toThrow('not released')
  })
})
