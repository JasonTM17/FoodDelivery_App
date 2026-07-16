import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import {
  ProductionSmokeCleanupBlockedError,
  cleanupProductionRoleSmokeFixture,
} from './production-role-smoke-fixture-cleanup'
import {
  PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION,
  assertDisposableProductionSmokeTestTarget,
  buildProductionSmokeIdentities,
  buildSingleConnectionDatabaseUrl,
  productionSmokeRestaurantSlug,
} from './production-role-smoke-fixture-config'
import {
  acquireProductionRoleSmokeLease,
  releaseProductionRoleSmokeLease,
} from './production-role-smoke-fixture-lease'
import { provisionProductionRoleSmokeFixture } from './production-role-smoke-fixture-provision'
import { assertDisposableProductionSmokeDatabaseIdentity } from './production-role-smoke-test-database'

const databaseUrl = process.env.PRODUCTION_ROLE_SMOKE_TEST_DATABASE_URL
const destructiveConfirmation = process.env.PRODUCTION_ROLE_SMOKE_TEST_CONFIRM
const integrationRequested = Boolean(databaseUrl || destructiveConfirmation)
if (integrationRequested) {
  assertDisposableProductionSmokeTestTarget(databaseUrl, destructiveConfirmation)
}
const describeDatabase = databaseUrl && destructiveConfirmation === PRODUCTION_ROLE_SMOKE_TEST_CONFIRMATION
  ? describe
  : describe.skip
const testDatabaseUrl = databaseUrl
  ?? 'postgresql://skip:skip@localhost:1/foodflow_role_smoke_skip?schema=public'
const testDatabaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.replace(/^\//, ''))

describeDatabase('production role smoke fixture database safety', () => {
  const runId = 'integration-0715'
  const identities = buildProductionSmokeIdentities(runId)
  const restaurantSlug = productionSmokeRestaurantSlug(runId)
  const prisma = new PrismaClient({
    datasourceUrl: buildSingleConnectionDatabaseUrl(testDatabaseUrl),
    log: [],
  })
  let leaseBackendPid: number | null = null
  let replacementRestaurantId: string | null = null
  let blockerUserId: string | null = null
  let databaseIdentityVerified = false
  let leaseWasAcquiredByThisTest = false

  beforeAll(async () => {
    await assertDisposableProductionSmokeDatabaseIdentity(prisma)
    const inventory = await Promise.all([
      prisma.user.count(),
      prisma.restaurant.count(),
      prisma.order.count(),
      prisma.driverLocationHistory.count(),
      prisma.productionRoleSmokeRun.count(),
    ])
    if (inventory.some(count => count !== 0)) {
      throw new Error('Fixture integration requires an empty disposable database')
    }
    databaseIdentityVerified = true
  })

  afterAll(async () => {
    const errors: unknown[] = []
    if (databaseIdentityVerified && leaseWasAcquiredByThisTest) {
      try {
        const run = await prisma.productionRoleSmokeRun.findUnique({ where: { runId } })
        const fixtureUserIds = run
          ? [run.adminUserId, run.restaurantUserId, run.customerUserId, run.driverUserId]
          : []
        const userIds = [...fixtureUserIds, ...(blockerUserId ? [blockerUserId] : [])]
        const restaurantIds = [
          ...(run ? [run.restaurantId] : []),
          ...(replacementRestaurantId ? [replacementRestaurantId] : []),
        ]
        await prisma.$transaction(async tx => {
          await tx.cart.deleteMany({
            where: {
              OR: [
                { userId: { in: userIds } },
                { restaurantId: { in: restaurantIds } },
              ],
            },
          })
          await tx.supportMacro.deleteMany({ where: { createdById: { in: userIds } } })
          await tx.customerProfile.deleteMany({ where: { userId: { in: userIds } } })
          await tx.driverProfile.deleteMany({ where: { userId: { in: userIds } } })
          await tx.restaurantProfile.deleteMany({ where: { userId: { in: userIds } } })
          await tx.restaurant.deleteMany({ where: { id: { in: restaurantIds } } })
          await tx.user.deleteMany({ where: { id: { in: userIds } } })
          await tx.productionRoleSmokeRun.deleteMany({ where: { runId } })
        })
      } catch (error) {
        errors.push(error)
      }
      if (leaseBackendPid !== null) {
        try {
          await releaseProductionRoleSmokeLease(prisma, leaseBackendPid)
          leaseBackendPid = null
        } catch (error) {
          errors.push(error)
        }
      }
    }
    try {
      await prisma.$disconnect()
    } catch (error) {
      errors.push(error)
    }
    if (errors.length > 0) throw new AggregateError(errors, 'Fixture integration teardown failed')
  })

  it('rejects empty recovery, preserves semantic residue, then deletes the immutable fixture', async () => {
    leaseBackendPid = await acquireProductionRoleSmokeLease(prisma, testDatabaseName)
    leaseWasAcquiredByThisTest = true

    await expect(cleanupProductionRoleSmokeFixture(prisma, {
      identities,
      restaurantSlug,
      runId,
      leaseBackendPid,
      expectedDatabaseName: testDatabaseName,
      expectation: 'recovery',
    })).rejects.toBeInstanceOf(ProductionSmokeCleanupBlockedError)

    const restaurantId = randomUUID()
    await provisionProductionRoleSmokeFixture(prisma, {
      identities,
      restaurantId,
      restaurantSlug,
      runId,
      passwordHash: 'integration-only-password-hash',
      leaseBackendPid,
      expectedDatabaseName: testDatabaseName,
    })
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: identities.admin.email },
      select: { id: true },
    })

    const wrongRunId = 'integration-0716'
    await expect(cleanupProductionRoleSmokeFixture(prisma, {
      identities: buildProductionSmokeIdentities(wrongRunId),
      restaurantSlug: productionSmokeRestaurantSlug(wrongRunId),
      runId: wrongRunId,
      leaseBackendPid,
      expectedDatabaseName: testDatabaseName,
      expectation: 'recovery',
    })).rejects.toBeInstanceOf(ProductionSmokeCleanupBlockedError)
    await expect(prisma.user.count({
      where: { email: { in: Object.values(identities).map(identity => identity.email) }, isActive: true },
    })).resolves.toBe(4)

    replacementRestaurantId = randomUUID()
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { slug: `${restaurantSlug}-moved` },
    })
    await prisma.$executeRaw`
      INSERT INTO restaurants (
        id, name, slug, location, address_line, city, cuisine_types,
        approval_status, approved_at, is_active, is_open, onboarding_state
      ) VALUES (
        ${replacementRestaurantId}::uuid,
        ${'Unowned Restaurant'},
        ${restaurantSlug},
        ST_SetSRID(ST_MakePoint(106.7009, 10.7769), 4326)::geography,
        ${'TOCTOU regression fixture'},
        ${'Ho Chi Minh City'},
        ARRAY['Vietnamese']::text[],
        'approved', NOW(), FALSE, FALSE, '{}'::jsonb
      )
    `
    await expect(cleanupProductionRoleSmokeFixture(prisma, {
      identities,
      restaurantSlug,
      runId,
      leaseBackendPid,
      expectedDatabaseName: testDatabaseName,
      expectation: 'complete',
    })).rejects.toBeInstanceOf(ProductionSmokeCleanupBlockedError)
    await expect(prisma.restaurant.count({
      where: { id: { in: [restaurantId, replacementRestaurantId] } },
    })).resolves.toBe(2)
    await prisma.restaurant.delete({ where: { id: replacementRestaurantId } })
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { slug: restaurantSlug },
    })

    const blocker = await prisma.user.create({
      data: {
        email: 'production-smoke-blocker@example.invalid',
        fullName: 'Production Smoke Blocker',
        passwordHash: 'integration-only-password-hash',
        role: 'customer',
      },
      select: { id: true },
    })
    blockerUserId = blocker.id
    await prisma.cart.create({ data: { userId: blocker.id, restaurantId } })

    await expect(cleanupProductionRoleSmokeFixture(prisma, {
      identities,
      restaurantSlug,
      runId,
      leaseBackendPid,
      expectedDatabaseName: testDatabaseName,
      expectation: 'complete',
    })).rejects.toBeInstanceOf(ProductionSmokeCleanupBlockedError)
    await expect(prisma.user.count({
      where: { email: { in: Object.values(identities).map(identity => identity.email) }, isActive: true },
    })).resolves.toBe(4)

    await prisma.cart.delete({ where: { userId: blocker.id } })
    await prisma.user.delete({ where: { id: blocker.id } })
    const lockPrisma = new PrismaClient({
      datasourceUrl: buildSingleConnectionDatabaseUrl(testDatabaseUrl),
      log: [],
    })
    let releaseSharedLock: (() => void) | undefined
    let reportSharedLock: (() => void) | undefined
    const sharedLockAcquired = new Promise<void>(resolve => { reportSharedLock = resolve })
    const sharedLockRelease = new Promise<void>(resolve => { releaseSharedLock = resolve })
    const sharedLock = lockPrisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${admin.id}::uuid FOR SHARE`
      reportSharedLock?.()
      await sharedLockRelease
    })
    let cleanupPromise: ReturnType<typeof cleanupProductionRoleSmokeFixture> | undefined
    try {
      await sharedLockAcquired
      let cleanupSettled = false
      cleanupPromise = cleanupProductionRoleSmokeFixture(prisma, {
        identities,
        restaurantSlug,
        runId,
        leaseBackendPid,
        expectedDatabaseName: testDatabaseName,
        expectation: 'complete',
      }).finally(() => { cleanupSettled = true })
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(cleanupSettled).toBe(false)
    } finally {
      releaseSharedLock?.()
      await sharedLock.catch(() => undefined)
      await lockPrisma.$disconnect()
    }
    if (!cleanupPromise) throw new Error('Cleanup did not start while the shared user lock was held')

    await expect(cleanupPromise).resolves.toMatchObject({
      outcome: 'deleted',
      restaurantId,
      userIds: expect.arrayContaining(Object.values(identities).map(identity => expect.any(String))),
    })
    await expect(prisma.supportMacro.create({
      data: {
        name: 'Late macro must fail',
        body: 'The creator no longer exists.',
        createdById: admin.id,
      },
    })).rejects.toMatchObject({ code: 'P2003' })

    const [users, profiles, restaurants, carts] = await Promise.all([
      prisma.user.count(),
      Promise.all([
        prisma.customerProfile.count(),
        prisma.driverProfile.count(),
        prisma.restaurantProfile.count(),
      ]).then(counts => counts.reduce((total, count) => total + count, 0)),
      prisma.restaurant.count(),
      prisma.cart.count(),
    ])
    expect({ users, profiles, restaurants, carts }).toEqual({
      users: 0,
      profiles: 0,
      restaurants: 0,
      carts: 0,
    })

    await expect(cleanupProductionRoleSmokeFixture(prisma, {
      identities,
      restaurantSlug,
      runId,
      leaseBackendPid,
      expectedDatabaseName: testDatabaseName,
      expectation: 'recovery',
    })).resolves.toMatchObject({
      outcome: 'already-deleted',
      restaurantId,
      userIds: expect.arrayContaining(Object.values(identities).map(() => expect.any(String))),
    })

    await releaseProductionRoleSmokeLease(prisma, leaseBackendPid)
    leaseBackendPid = null
  }, 60_000)
})
