import { randomUUID } from 'node:crypto'
import { Prisma, PrismaClient } from '@prisma/client'
import { STAFF_CAPABILITIES } from '../restaurant-portal/restaurant-staff-capabilities'
import {
  ProductionSmokeIdentity,
  ProductionSmokeRole,
  productionSmokeRoles,
} from './production-role-smoke-fixture-config'
import { productionSmokeRestaurantMarker } from './production-role-smoke-fixture-cleanup'
import { assertProductionRoleSmokeLease } from './production-role-smoke-fixture-lease'
import {
  ProductionSmokeRunSnapshot,
  ProductionSmokeUserIds,
  createProductionSmokeRun,
  productionSmokeRunStates,
} from './production-role-smoke-fixture-lifecycle'

interface ProvisionContext {
  identities: Record<ProductionSmokeRole, ProductionSmokeIdentity>
  restaurantId: string
  restaurantSlug: string
  runId: string
  passwordHash: string
  leaseBackendPid: number
  expectedDatabaseName?: string
  onMutationStart?: () => void
}

export async function provisionProductionRoleSmokeFixture(
  prisma: PrismaClient,
  context: ProvisionContext,
): Promise<ProductionSmokeRunSnapshot> {
  return prisma.$transaction(async tx => {
    await assertProductionRoleSmokeLease(
      tx,
      context.leaseBackendPid,
      context.expectedDatabaseName,
    )
    const inventory = await Promise.all([
      tx.user.count(),
      tx.restaurant.count(),
      tx.order.count(),
      tx.driverLocationHistory.count(),
      tx.productionRoleSmokeRun.count({
        where: { state: { not: productionSmokeRunStates.complete } },
      }),
    ])
    if (inventory.some(count => count !== 0)) {
      throw new Error(
        'Production role smoke requires zero users, restaurants, orders, GPS rows, and unfinished smoke runs',
      )
    }

    context.onMutationStart?.()
    const userIds = Object.fromEntries(
      productionSmokeRoles.map(role => [role, randomUUID()]),
    ) as ProductionSmokeUserIds
    await createProductionSmokeRun(tx, {
      runId: context.runId,
      restaurantId: context.restaurantId,
      restaurantSlug: context.restaurantSlug,
      userIds,
    })
    for (const role of productionSmokeRoles) {
      const identity = context.identities[role]
      await tx.user.create({
        data: {
          id: userIds[role],
          email: identity.email,
          fullName: identity.fullName,
          passwordHash: context.passwordHash,
          role,
        },
      })
    }

    await tx.customerProfile.create({ data: { userId: userIds.customer } })
    await tx.driverProfile.create({
      data: { userId: userIds.driver, isVerified: true },
    })
    await tx.$executeRaw`
      INSERT INTO restaurants (
        id, name, slug, location, address_line, city, cuisine_types,
        approval_status, approved_at, is_active, is_open, onboarding_state
      ) VALUES (
        ${context.restaurantId}::uuid,
        ${'Production Smoke Restaurant'},
        ${context.restaurantSlug},
        ST_SetSRID(ST_MakePoint(106.7009, 10.7769), 4326)::geography,
        ${'Temporary production smoke fixture'},
        ${'Ho Chi Minh City'},
        ARRAY['Vietnamese']::text[],
        'approved', NOW(), FALSE, FALSE,
        ${JSON.stringify({ fixture: productionSmokeRestaurantMarker, runId: context.runId })}::jsonb
      )
    `
    await tx.restaurantProfile.create({
      data: {
        userId: userIds.restaurant,
        restaurantId: context.restaurantId,
        staffRole: 'owner',
        permissions: [...STAFF_CAPABILITIES],
        onboardingCompletedAt: new Date(),
      },
    })
    return {
      runId: context.runId,
      restaurantId: context.restaurantId,
      restaurantSlug: context.restaurantSlug,
      userIds,
      state: productionSmokeRunStates.active,
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 })
}
