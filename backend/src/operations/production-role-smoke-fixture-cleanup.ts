import { Prisma, PrismaClient } from '@prisma/client'
import { ProductionSmokeIdentity, ProductionSmokeRole } from './production-role-smoke-fixture-config'
import { assertProductionRoleSmokeLease } from './production-role-smoke-fixture-lease'
import {
  ProductionSmokeRunSnapshot,
  loadProductionSmokeRun,
  lockAndLoadProductionSmokeRun,
  markProductionSmokeDeletionCommitted,
  productionSmokeRunStates,
  sameProductionSmokeRunIdentity,
} from './production-role-smoke-fixture-lifecycle'

export const productionSmokeRestaurantMarker = 'foodflow-production-role-smoke'

export class ProductionSmokeCleanupBlockedError extends Error {
  override readonly name = 'ProductionSmokeCleanupBlockedError'
}

export type ProductionSmokeCleanupExpectation = 'complete' | 'recovery' | 'reconcile'

export interface ProductionSmokeCleanupContext {
  identities: Record<ProductionSmokeRole, ProductionSmokeIdentity>
  restaurantSlug: string
  runId: string
  leaseBackendPid: number
  expectedDatabaseName?: string
  expectation: ProductionSmokeCleanupExpectation
}

export interface ProductionSmokeCleanupResult {
  outcome: 'absent' | 'already-deleted' | 'deleted'
  userIds: string[]
  restaurantId?: string
  run: ProductionSmokeRunSnapshot | null
}

export async function cleanupProductionRoleSmokeFixture(
  prisma: PrismaClient,
  context: ProductionSmokeCleanupContext,
): Promise<ProductionSmokeCleanupResult> {
  const emails = Object.values(context.identities).map(identity => identity.email)
  const result = await prisma.$transaction(async tx => {
    await assertProductionRoleSmokeLease(
      tx,
      context.leaseBackendPid,
      context.expectedDatabaseName,
    )
    const run = await lockAndLoadProductionSmokeRun(tx, context.runId)
    const initial = await loadAndValidateOwnership(tx, context, emails, run)
    if (!run) {
      if (context.expectation !== 'reconcile') {
        throw new ProductionSmokeCleanupBlockedError('Exact production smoke lifecycle does not exist')
      }
      return { outcome: 'absent' as const, userIds: [], run: null }
    }

    const userIds = Object.values(run.userIds)
    const restaurantId = run.restaurantId
    if (run.state !== productionSmokeRunStates.active) {
      return {
        outcome: 'already-deleted' as const,
        userIds,
        restaurantId,
        run,
      }
    }

    await lockFixtureRows(tx, userIds, restaurantId)

    const locked = await loadAndValidateOwnership(tx, context, emails, run)
    assertSameOwnedRows(initial, locked)
    await assertProductionRoleSmokeLease(
      tx,
      context.leaseBackendPid,
      context.expectedDatabaseName,
    )
    await assertNoUnexpectedSideEffects(tx, userIds, restaurantId)
    await tx.user.updateMany({
      where: { id: { in: userIds } },
      data: { isActive: false },
    })
    await tx.restaurantProfile.deleteMany({ where: { userId: { in: userIds } } })
    await tx.customerProfile.deleteMany({ where: { userId: { in: userIds } } })
    await tx.driverProfile.deleteMany({ where: { userId: { in: userIds } } })
    await tx.restaurant.delete({ where: { id: restaurantId } })
    await tx.user.deleteMany({ where: { id: { in: userIds } } })
    await assertNoUnexpectedSideEffects(tx, userIds, restaurantId)

    const [remainingUsers, remainingRestaurant] = await Promise.all([
      tx.user.count({ where: { id: { in: userIds } } }),
      tx.restaurant.count({ where: { id: restaurantId } }),
    ])
    if (remainingUsers + remainingRestaurant !== 0) {
      throw new Error('Production smoke fixture transaction verification failed')
    }
    await markProductionSmokeDeletionCommitted(tx, run)
    return {
      outcome: 'deleted' as const,
      userIds,
      restaurantId,
      run: { ...run, state: productionSmokeRunStates.deletionCommitted },
    }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 })

  await verifyProductionRoleSmokeFixtureResidue(prisma, context, result)
  return result
}

export async function verifyProductionRoleSmokeFixtureResidue(
  prisma: PrismaClient,
  context: ProductionSmokeCleanupContext,
  result: ProductionSmokeCleanupResult,
): Promise<void> {
  const emails = Object.values(context.identities).map(identity => identity.email)
  await assertProductionRoleSmokeLease(
    prisma,
    context.leaseBackendPid,
    context.expectedDatabaseName,
  )
  const persistedRun = await loadProductionSmokeRun(prisma, context.runId)
  if (result.run) {
    if (!persistedRun || !sameProductionSmokeRunIdentity(result.run, persistedRun)
      || persistedRun.state === productionSmokeRunStates.active) {
      throw new Error('Production smoke lifecycle cleanup verification failed')
    }
  } else if (persistedRun) {
    throw new Error('Unexpected production smoke lifecycle exists after empty reconciliation')
  }
  await assertNoUnexpectedSideEffects(prisma, result.userIds, result.restaurantId)
  const [remainingUsers, remainingCustomers, remainingDrivers, remainingRestaurantProfiles, remainingRestaurants] = await Promise.all([
    prisma.user.count({ where: { OR: [{ email: { in: emails } }, { id: { in: result.userIds } }] } }),
    prisma.customerProfile.count({ where: { userId: { in: result.userIds } } }),
    prisma.driverProfile.count({ where: { userId: { in: result.userIds } } }),
    prisma.restaurantProfile.count({ where: { userId: { in: result.userIds } } }),
    prisma.restaurant.count({ where: {
      OR: [
        { slug: context.restaurantSlug },
        ...(result.restaurantId ? [{ id: result.restaurantId }] : []),
      ],
    } }),
  ])
  const remaining = remainingUsers + remainingCustomers + remainingDrivers
    + remainingRestaurantProfiles + remainingRestaurants
  if (remaining !== 0) throw new Error('Production smoke fixture cleanup verification failed')
  await assertProductionRoleSmokeLease(
    prisma,
    context.leaseBackendPid,
    context.expectedDatabaseName,
  )
}

async function loadAndValidateOwnership(
  prisma: PrismaClient | Prisma.TransactionClient,
  context: ProductionSmokeCleanupContext,
  emails: string[],
  run: ProductionSmokeRunSnapshot | null,
) {
  const runUserIds = run ? Object.values(run.userIds) : []
  const [users, restaurants] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { email: { in: emails } },
          ...(run ? [{ id: { in: runUserIds } }] : []),
        ],
      },
      select: {
        id: true, email: true, fullName: true, role: true,
        customerProfile: { select: { id: true } },
        driverProfile: { select: { id: true } },
        restaurantProfile: { select: { id: true, restaurantId: true } },
      },
    }),
    prisma.restaurant.findMany({
      where: {
        OR: [
          { slug: context.restaurantSlug },
          ...(run ? [{ id: run.restaurantId }] : []),
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        isOpen: true,
        onboardingState: true,
      },
    }),
  ])
  if (restaurants.length > 1) {
    throw new ProductionSmokeCleanupBlockedError('Production smoke restaurant namespace is ambiguous')
  }
  const restaurant = restaurants[0]

  const fixtureExists = users.length > 0 || Boolean(restaurant)
  if (!run) {
    if (fixtureExists) {
      throw new ProductionSmokeCleanupBlockedError('Production smoke namespace has no durable ownership record')
    }
    return { users, restaurant }
  }
  if (run.restaurantSlug !== context.restaurantSlug) {
    throw new ProductionSmokeCleanupBlockedError('Production smoke lifecycle slug does not match the requested run')
  }
  if (run.state !== productionSmokeRunStates.active) {
    if (fixtureExists) {
      throw new ProductionSmokeCleanupBlockedError('Deleted production smoke lifecycle still has fixture rows')
    }
    return { users, restaurant }
  }
  if (users.length !== Object.keys(context.identities).length || !restaurant) {
    throw new ProductionSmokeCleanupBlockedError('Active production smoke fixture topology is incomplete')
  }

  const expectedByEmail = new Map(Object.values(context.identities).map(identity => [identity.email, identity]))
  for (const user of users) {
    const expected = expectedByEmail.get(user.email)
    const expectedProfile = expected?.role === 'customer' ? user.customerProfile
      : expected?.role === 'driver' ? user.driverProfile
        : expected?.role === 'restaurant' ? user.restaurantProfile
          : expected?.role === 'admin' ? true : false
    const hasForeignProfile = expected?.role !== 'customer' && user.customerProfile
      || expected?.role !== 'driver' && user.driverProfile
      || expected?.role !== 'restaurant' && user.restaurantProfile
    const missingRequiredProfile = !expectedProfile
    if (!expected || user.fullName !== expected.fullName || user.role !== expected.role
      || user.id !== run.userIds[expected.role] || missingRequiredProfile || hasForeignProfile) {
      throw new ProductionSmokeCleanupBlockedError('Exact production smoke user namespace is not owned by this fixture')
    }
  }

  if (restaurant) {
    const marker = readMarker(restaurant.onboardingState)
    if (restaurant.id !== run.restaurantId || restaurant.slug !== context.restaurantSlug
      || restaurant.name !== 'Production Smoke Restaurant'
      || restaurant.isActive || restaurant.isOpen
      || marker.fixture !== productionSmokeRestaurantMarker || marker.runId !== context.runId) {
      throw new ProductionSmokeCleanupBlockedError('Exact production smoke restaurant namespace is not owned by this fixture')
    }
    const restaurantUser = users.find(user => user.role === 'restaurant')
    if (restaurantUser?.restaurantProfile
      && restaurantUser.restaurantProfile.restaurantId !== restaurant.id) {
      throw new ProductionSmokeCleanupBlockedError('Production smoke restaurant ownership topology is invalid')
    }
  }
  const restaurantProfile = users.find(user => user.role === 'restaurant')?.restaurantProfile
  if (!restaurantProfile || restaurantProfile.restaurantId !== run.restaurantId) {
    throw new ProductionSmokeCleanupBlockedError('Production smoke restaurant ownership topology is incomplete')
  }
  return { users, restaurant }
}

function assertSameOwnedRows(
  initial: Awaited<ReturnType<typeof loadAndValidateOwnership>>,
  locked: Awaited<ReturnType<typeof loadAndValidateOwnership>>,
): void {
  const initialUserIds = initial.users.map(user => user.id).sort()
  const lockedUserIds = locked.users.map(user => user.id).sort()
  if (initialUserIds.length !== lockedUserIds.length
    || initialUserIds.some((userId, index) => userId !== lockedUserIds[index])
    || initial.restaurant?.id !== locked.restaurant?.id) {
    throw new ProductionSmokeCleanupBlockedError('Production smoke ownership changed during cleanup')
  }
}

async function lockFixtureRows(
  tx: Prisma.TransactionClient,
  userIds: string[],
  restaurantId: string | undefined,
): Promise<void> {
  if (userIds.length > 0) {
    const typedUserIds = userIds.map(userId => Prisma.sql`${userId}::uuid`)
    await tx.$queryRaw(Prisma.sql`
      SELECT id FROM users WHERE id IN (${Prisma.join(typedUserIds)}) FOR UPDATE
    `)
  }
  if (restaurantId) {
    await tx.$queryRaw`SELECT id FROM restaurants WHERE id = ${restaurantId}::uuid FOR UPDATE`
  }
  if (userIds.length > 0) {
    const typedUserIds = userIds.map(userId => Prisma.sql`${userId}::uuid`)
    await tx.$queryRaw(Prisma.sql`
      SELECT id FROM customer_profiles WHERE user_id IN (${Prisma.join(typedUserIds)}) FOR UPDATE
    `)
    await tx.$queryRaw(Prisma.sql`
      SELECT id FROM driver_profiles WHERE user_id IN (${Prisma.join(typedUserIds)}) FOR UPDATE
    `)
    await tx.$queryRaw(Prisma.sql`
      SELECT id FROM restaurant_profiles WHERE user_id IN (${Prisma.join(typedUserIds)}) FOR UPDATE
    `)
  }
}

async function assertNoUnexpectedSideEffects(
  tx: PrismaClient | Prisma.TransactionClient,
  userIds: string[],
  restaurantId: string | undefined,
): Promise<void> {
  const userWhere = { in: userIds }
  const driverProfileIds = (await tx.driverProfile.findMany({
    where: { userId: userWhere },
    select: { id: true },
  })).map(profile => profile.id)
  const restaurantOnly = (operation: () => Promise<number>): Promise<number> => (
    restaurantId ? operation() : Promise.resolve(0)
  )
  const checks: Array<[string, Promise<number>]> = [
    ['orders', tx.order.count({ where: { OR: [{ customerId: userWhere }, { driverId: userWhere }, ...(restaurantId ? [{ restaurantId }] : [])] } })],
    ['addresses', tx.address.count({ where: { userId: userWhere } })],
    ['carts', tx.cart.count({ where: { OR: [{ userId: userWhere }, ...(restaurantId ? [{ restaurantId }] : [])] } })],
    ['gps', tx.driverLocationHistory.count({ where: { driverId: userWhere } })],
    ['fcm', tx.userFcmToken.count({ where: { userId: userWhere } })],
    ['notifications', tx.notification.count({ where: { userId: userWhere } })],
    ['notification-settings', tx.notificationSetting.count({ where: { userId: userWhere } })],
    ['chat', tx.chatSession.count({ where: { userId: userWhere } })],
    ['chat-senders', tx.chatMessage.count({ where: { senderId: userWhere } })],
    ['ai-usage', tx.aiUsageEvent.count({ where: { userId: userWhere } })],
    ['support', tx.aiSupportTicket.count({ where: { OR: [{ userId: userWhere }, { assignedAdminId: userWhere }] } })],
    ['support-messages', tx.supportTicketMessage.count({ where: { senderId: userWhere } })],
    ['support-macros', tx.supportMacro.count({ where: { createdById: userWhere } })],
    ['support-csat', tx.supportCsatResponse.count({ where: { userId: userWhere } })],
    ['exports', tx.adminExportJob.count({ where: { requestedById: userWhere } })],
    ['audit', tx.adminAuditLog.count({ where: {
      OR: [
        { adminId: userWhere },
        { targetId: userWhere },
        ...(restaurantId ? [{ targetId: restaurantId }] : []),
      ],
    } })],
    ['loyalty', tx.loyaltyTransaction.count({ where: { userId: userWhere } })],
    ['wallet', tx.walletTransaction.count({ where: { userId: userWhere } })],
    ['referral-codes', tx.referralCode.count({ where: { userId: userWhere } })],
    ['referrals', tx.referralRedemption.count({ where: { OR: [{ referrerUserId: userWhere }, { inviteeUserId: userWhere }] } })],
    ['promotion-usage', tx.promotionUsage.count({ where: { userId: userWhere } })],
    ['bank', tx.driverBankAccount.count({ where: { driverId: userWhere } })],
    ['kyc', tx.driverKycSubmission.count({ where: { OR: [{ driverProfileId: { in: driverProfileIds } }, { reviewedById: userWhere }] } })],
    ['tips', tx.driverTipReport.count({ where: { driverId: userWhere } })],
    ['dispatch', tx.dispatchOffer.count({ where: { driverId: userWhere } })],
    ['idempotency', tx.idempotencyRequest.count({ where: { userId: userWhere } })],
    ['platform-settings', tx.platformSetting.count({ where: { updatedById: userWhere } })],
    ['email-tokens', tx.emailVerificationToken.count({ where: { userId: userWhere } })],
    ['password-tokens', tx.passwordResetToken.count({ where: { userId: userWhere } })],
    ['restaurant-approvals', tx.restaurant.count({ where: { approvedById: userWhere } })],
    ['restaurant-staff', restaurantOnly(() => tx.restaurantProfile.count({ where: { restaurantId, userId: { notIn: userIds } } }))],
    ['restaurant-hours', restaurantOnly(() => tx.restaurantOpeningHour.count({ where: { restaurantId } }))],
    ['restaurant-closures', restaurantOnly(() => tx.restaurantHolidayClosure.count({ where: { restaurantId } }))],
    ['restaurant-categories', restaurantOnly(() => tx.category.count({ where: { restaurantId } }))],
    ['restaurant-menu', restaurantOnly(() => tx.menuItem.count({ where: { restaurantId } }))],
    ['promotions', tx.promotion.count({ where: { OR: [{ createdById: userWhere }, ...(restaurantId ? [{ restaurantId }] : [])] } })],
    ['restaurant-invites', tx.staffInvite.count({ where: { OR: [{ invitedById: userWhere }, ...(restaurantId ? [{ restaurantId }] : [])] } })],
    ['restaurant-shifts', restaurantOnly(() => tx.staffShift.count({ where: { restaurantId } }))],
    ['reviews', tx.review.count({ where: { OR: [{ customerId: userWhere }, { driverId: userWhere }, ...(restaurantId ? [{ restaurantId }] : [])] } })],
    ['rag', restaurantOnly(() => tx.ragDocument.count({ where: { sourceId: restaurantId } }))],
  ]
  const counts = await Promise.all(checks.map(([, operation]) => operation))
  const unexpected = checks.flatMap(([name], index) => counts[index] ? [`${name}:${counts[index]}`] : [])
  if (unexpected.length > 0) {
    console.error(`CLEANUP_BLOCKED unexpectedRelations=${unexpected.join(',')}`)
    throw new ProductionSmokeCleanupBlockedError('Production smoke fixture has unexpected dependent rows')
  }
}

function readMarker(value: Prisma.JsonValue): { fixture?: string; runId?: string } {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {}
  return {
    fixture: typeof value.fixture === 'string' ? value.fixture : undefined,
    runId: typeof value.runId === 'string' ? value.runId : undefined,
  }
}
