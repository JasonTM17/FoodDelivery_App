import { Prisma, PrismaClient } from '@prisma/client'
import {
  ProductionSmokeRole,
  productionSmokeRoles,
} from './production-role-smoke-fixture-config'
import { assertProductionRoleSmokeLease } from './production-role-smoke-fixture-lease'

export const productionSmokeRunStates = {
  active: 'active',
  deletionCommitted: 'deletion_committed',
  complete: 'complete',
} as const

export type ProductionSmokeRunState =
  (typeof productionSmokeRunStates)[keyof typeof productionSmokeRunStates]

export type ProductionSmokeUserIds = Record<ProductionSmokeRole, string>

export interface ProductionSmokeRunSnapshot {
  runId: string
  restaurantId: string
  restaurantSlug: string
  userIds: ProductionSmokeUserIds
  state: ProductionSmokeRunState
}

interface ProductionSmokeRunIdentity {
  runId: string
  restaurantId: string
  restaurantSlug: string
  userIds: ProductionSmokeUserIds
}

export async function createProductionSmokeRun(
  tx: Prisma.TransactionClient,
  identity: ProductionSmokeRunIdentity,
): Promise<void> {
  await tx.productionRoleSmokeRun.create({
    data: {
      runId: identity.runId,
      restaurantId: identity.restaurantId,
      restaurantSlug: identity.restaurantSlug,
      adminUserId: identity.userIds.admin,
      restaurantUserId: identity.userIds.restaurant,
      customerUserId: identity.userIds.customer,
      driverUserId: identity.userIds.driver,
      state: productionSmokeRunStates.active,
    },
  })
}

export async function loadProductionSmokeRun(
  prisma: PrismaClient | Prisma.TransactionClient,
  runId: string,
): Promise<ProductionSmokeRunSnapshot | null> {
  const run = await prisma.productionRoleSmokeRun.findUnique({
    where: { runId },
    select: {
      runId: true,
      restaurantId: true,
      restaurantSlug: true,
      adminUserId: true,
      restaurantUserId: true,
      customerUserId: true,
      driverUserId: true,
      state: true,
    },
  })
  if (!run) return null
  if (!Object.values(productionSmokeRunStates).includes(run.state as ProductionSmokeRunState)) {
    throw new Error('Production smoke lifecycle state is invalid')
  }
  return {
    runId: run.runId,
    restaurantId: run.restaurantId,
    restaurantSlug: run.restaurantSlug,
    userIds: {
      admin: run.adminUserId,
      restaurant: run.restaurantUserId,
      customer: run.customerUserId,
      driver: run.driverUserId,
    },
    state: run.state as ProductionSmokeRunState,
  }
}

export async function lockAndLoadProductionSmokeRun(
  tx: Prisma.TransactionClient,
  runId: string,
): Promise<ProductionSmokeRunSnapshot | null> {
  await tx.$queryRaw`SELECT run_id FROM production_role_smoke_runs WHERE run_id = ${runId} FOR UPDATE`
  return loadProductionSmokeRun(tx, runId)
}

export async function markProductionSmokeDeletionCommitted(
  tx: Prisma.TransactionClient,
  run: ProductionSmokeRunSnapshot,
): Promise<void> {
  const updated = await tx.productionRoleSmokeRun.updateMany({
    where: {
      runId: run.runId,
      state: productionSmokeRunStates.active,
      restaurantId: run.restaurantId,
      restaurantSlug: run.restaurantSlug,
      adminUserId: run.userIds.admin,
      restaurantUserId: run.userIds.restaurant,
      customerUserId: run.userIds.customer,
      driverUserId: run.userIds.driver,
    },
    data: {
      state: productionSmokeRunStates.deletionCommitted,
      deletionCommittedAt: new Date(),
    },
  })
  if (updated.count !== 1) throw new Error('Production smoke lifecycle deletion transition failed')
}

export async function markProductionSmokeCapabilityDrainComplete(
  prisma: PrismaClient,
  run: ProductionSmokeRunSnapshot,
  leaseBackendPid: number,
  expectedDatabaseName = 'postgres',
): Promise<void> {
  await prisma.$transaction(async tx => {
    await assertProductionRoleSmokeLease(tx, leaseBackendPid, expectedDatabaseName)
    const locked = await lockAndLoadProductionSmokeRun(tx, run.runId)
    if (!locked || !sameProductionSmokeRunIdentity(run, locked)) {
      throw new Error('Production smoke lifecycle ownership changed before finalization')
    }
    if (locked.state === productionSmokeRunStates.complete) return
    if (locked.state !== productionSmokeRunStates.deletionCommitted) {
      throw new Error('Production smoke lifecycle is not ready for finalization')
    }
    const updated = await tx.productionRoleSmokeRun.updateMany({
      where: {
        runId: locked.runId,
        state: productionSmokeRunStates.deletionCommitted,
      },
      data: {
        state: productionSmokeRunStates.complete,
        capabilityDrainDoneAt: new Date(),
      },
    })
    if (updated.count !== 1) throw new Error('Production smoke lifecycle finalization failed')
    await assertProductionRoleSmokeLease(tx, leaseBackendPid, expectedDatabaseName)
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 })
}

export function sameProductionSmokeRunIdentity(
  expected: ProductionSmokeRunSnapshot,
  actual: ProductionSmokeRunSnapshot,
): boolean {
  return expected.runId === actual.runId
    && expected.restaurantId === actual.restaurantId
    && expected.restaurantSlug === actual.restaurantSlug
    && productionSmokeRoles.every(role => expected.userIds[role] === actual.userIds[role])
}
