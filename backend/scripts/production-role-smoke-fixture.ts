import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { REALTIME_TOKEN_TTL_SECONDS } from '../src/realtime/realtime-token.service'
import {
  ProductionSmokeCleanupExpectation,
  ProductionSmokeCleanupResult,
  cleanupProductionRoleSmokeFixture,
  verifyProductionRoleSmokeFixtureResidue,
} from '../src/operations/production-role-smoke-fixture-cleanup'
import {
  acquireProductionRoleSmokeLease,
  assertProductionRoleSmokeLease,
  releaseProductionRoleSmokeLease,
} from '../src/operations/production-role-smoke-fixture-lease'
import { provisionProductionRoleSmokeFixture } from '../src/operations/production-role-smoke-fixture-provision'
import { markProductionSmokeCapabilityDrainComplete } from '../src/operations/production-role-smoke-fixture-lifecycle'
import {
  assertProductionDatabaseTarget,
  buildProductionSmokeIdentities,
  buildSingleConnectionDatabaseUrl,
  parseProductionRoleSmokeFixtureConfig,
  productionSmokeRestaurantSlug,
  productionSmokeRoles,
} from '../src/operations/production-role-smoke-fixture-config'

const config = parseProductionRoleSmokeFixtureConfig(process.env)
assertProductionDatabaseTarget({
  databaseUrl: process.env.DATABASE_URL,
  supabaseUrl: process.env.SUPABASE_URL,
  railwayEnvironmentName: process.env.RAILWAY_ENVIRONMENT_NAME,
})
const identities = buildProductionSmokeIdentities(config.runId)
const emails = productionSmokeRoles.map(role => identities[role].email)
const restaurantSlug = productionSmokeRestaurantSlug(config.runId)
const lifecycleDeadline = config.mode === 'provision'
  ? Date.now() + config.maxSeconds * 1000
  : null
const prisma = new PrismaClient({
  datasourceUrl: buildSingleConnectionDatabaseUrl(process.env.DATABASE_URL),
  log: [],
})

let ownsFixture = false
let provisionMutationStarted = false
let stopRequested = false
let cleanupAttempted = false
let cleanupInProgress = false
let cleanupCompleted = false
let cleanupResult: ProductionSmokeCleanupResult | null = null
let leaseAcquired = false
let leaseBackendPid: number | null = null
let databaseDisconnected = false

process.on('SIGINT', () => { stopRequested = true })
process.on('SIGTERM', () => { stopRequested = true })

async function provision(): Promise<void> {
  if (config.mode !== 'provision') throw new Error('Provision config required')
  if (existsSync(config.signalPath)) {
    throw new Error('Cleanup signal already exists; remove it before provisioning')
  }

  const passwordHash = await bcrypt.hash(config.password, 12)
  const restaurantId = randomUUID()
  await provisionProductionRoleSmokeFixture(prisma, {
    identities,
    restaurantId,
    restaurantSlug,
    runId: config.runId,
    passwordHash,
    leaseBackendPid: requiredLeaseBackendPid(),
    onMutationStart: () => { provisionMutationStarted = true },
  })

  ownsFixture = true
  const cleanupInSeconds = lifecycleDeadline === null
    ? 0
    : Math.max(0, Math.ceil((lifecycleDeadline - Date.now()) / 1000))
  console.log(`READY run=${config.runId} identities=${emails.length} cleanupIn=${cleanupInSeconds}s`)
}

async function acquireExclusiveLease(): Promise<void> {
  leaseBackendPid = await acquireProductionRoleSmokeLease(prisma)
  leaseAcquired = true
}

async function releaseExclusiveLease(): Promise<void> {
  if (!leaseAcquired) return
  await releaseProductionRoleSmokeLease(prisma, requiredLeaseBackendPid())
  leaseAcquired = false
  leaseBackendPid = null
}

async function waitForCleanupTrigger(): Promise<void> {
  if (config.mode !== 'provision') throw new Error('Provision config required')
  if (lifecycleDeadline === null) throw new Error('Provision deadline required')
  while (!stopRequested && !existsSync(config.signalPath) && Date.now() < lifecycleDeadline) {
    await delay(5000)
    await assertProductionRoleSmokeLease(prisma, requiredLeaseBackendPid())
  }
  const trigger = existsSync(config.signalPath) ? 'signal' : stopRequested ? 'process-signal' : 'timeout'
  console.log(`CLEANUP_TRIGGER=${trigger}`)
}

async function cleanup(expectation: ProductionSmokeCleanupExpectation): Promise<void> {
  if (cleanupInProgress || cleanupCompleted) return
  cleanupAttempted = true
  cleanupInProgress = true
  try {
    await cleanupOnce(expectation)
    cleanupCompleted = true
  } finally {
    cleanupInProgress = false
  }
}

async function cleanupOnce(expectation: ProductionSmokeCleanupExpectation): Promise<void> {
  cleanupResult = await cleanupProductionRoleSmokeFixture(prisma, {
    identities,
    restaurantSlug,
    runId: config.runId,
    leaseBackendPid: requiredLeaseBackendPid(),
    expectation,
  })
  console.log(`CLEANUP_OK remainingUsers=0 remainingProfiles=0 remainingRestaurants=0 outcome=${cleanupResult.outcome}`)
}

function requiredLeaseBackendPid(): number {
  if (!leaseAcquired || leaseBackendPid === null) throw new Error('Production role smoke database lease is unavailable')
  return leaseBackendPid
}

async function disconnectDatabase(): Promise<void> {
  if (databaseDisconnected) return
  await prisma.$disconnect()
  databaseDisconnected = true
}

async function drainIssuedCapabilities(): Promise<void> {
  const seconds = REALTIME_TOKEN_TTL_SECONDS + 5
  console.log(`CAPABILITY_DRAIN seconds=${seconds}`)
  await delay(seconds * 1000)
  console.log('CAPABILITY_DRAIN_OK realtimeTokensExpired=true')
}

async function completeCleanup(expectation: ProductionSmokeCleanupExpectation): Promise<void> {
  await cleanup(expectation)
  if (!cleanupResult) throw new Error('Production role smoke cleanup result is unavailable')
  if (cleanupResult.run) await drainIssuedCapabilities()
  await verifyProductionRoleSmokeFixtureResidue(prisma, {
    identities,
    restaurantSlug,
    runId: config.runId,
    leaseBackendPid: requiredLeaseBackendPid(),
    expectation,
  }, cleanupResult)
  if (cleanupResult.run) {
    await markProductionSmokeCapabilityDrainComplete(
      prisma,
      cleanupResult.run,
      requiredLeaseBackendPid(),
    )
  }
  console.log('FINAL_RESIDUE_OK users=0 profiles=0 restaurants=0 relations=0')
  await releaseExclusiveLease()
  await disconnectDatabase()
}

async function ensureExclusiveLeaseForReconciliation(): Promise<void> {
  if (leaseAcquired) {
    try {
      await assertProductionRoleSmokeLease(prisma, requiredLeaseBackendPid())
      return
    } catch {
      leaseAcquired = false
      leaseBackendPid = null
    }
  }
  await acquireExclusiveLease()
}

async function main(): Promise<void> {
  await acquireExclusiveLease()
  if (config.mode === 'cleanup') {
    console.log(`RECOVERY_CLEANUP run=${config.runId}`)
    await completeCleanup('recovery')
    return
  }
  try {
    await provision()
    await waitForCleanupTrigger()
    await completeCleanup('complete')
  } catch (error) {
    if (provisionMutationStarted && !cleanupAttempted && !cleanupCompleted) {
      console.error(`RECOVERY_REQUIRED run=${config.runId}`)
      try {
        await ensureExclusiveLeaseForReconciliation()
        await completeCleanup(ownsFixture ? 'complete' : 'reconcile')
        console.log(`RECOVERY_RECONCILED run=${config.runId}`)
      } catch (recoveryError) {
        const recoveryName = recoveryError instanceof Error ? recoveryError.name : 'UnknownRecoveryFailure'
        console.error(`RECOVERY_FAILED ${recoveryName}`)
        throw new AggregateError([error, recoveryError], 'Provisioning failed and automatic reconciliation did not complete')
      }
    } else if (provisionMutationStarted && !cleanupCompleted) {
      console.error(`RECOVERY_REQUIRED run=${config.runId}`)
    }
    throw error
  }
}

main()
  .catch(error => {
    const name = error instanceof Error ? error.name : 'UnknownFixtureFailure'
    console.error(`FIXTURE_FAILED ${name}`)
    process.exitCode = 1
  })
  .finally(async () => {
    try {
      await releaseExclusiveLease()
    } catch (error) {
      const message = error instanceof Error ? error.name : 'Unknown lease release failure'
      console.error(`LEASE_RELEASE_FAILED ${message}`)
      process.exitCode = 1
    }
    try {
      await disconnectDatabase()
    } catch (error) {
      const message = error instanceof Error ? error.name : 'Unknown disconnect failure'
      console.error(`DISCONNECT_FAILED ${message}`)
      process.exitCode = 1
    }
  })
