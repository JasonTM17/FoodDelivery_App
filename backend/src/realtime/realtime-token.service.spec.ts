import { ForbiddenException, InternalServerErrorException } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { decode } from 'jsonwebtoken'
import { generateKeyPairSync } from 'node:crypto'
import { RealtimeTokenService } from './realtime-token.service'

describe('RealtimeTokenService', () => {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'SUPABASE_REALTIME_JWT_PRIVATE_KEY') return privatePem
      if (key === 'SUPABASE_REALTIME_JWT_KEY_ID') return 'foodflow-test-es256'
      return undefined
    }),
  }
  const prisma = {
    order: { findUnique: jest.fn() },
    restaurantProfile: { findFirst: jest.fn() },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('issues admin-scoped channels without wildcard access', async () => {
    const service = new RealtimeTokenService(config as never, prisma as never)

    const result = await service.issueToken({ sub: customerUuid(1), role: UserRole.admin })
    const decoded = decode(result.token, { complete: true }) as unknown as {
      header: { alg: string; kid: string };
      payload: { realtime_channels: string[]; app_role: string };
    }
    const payload = decoded.payload

    expect(result.channels).toEqual([
      `private:user:${customerUuid(1)}:notifications`,
      'private:admin:drivers',
      'private:admin:orders',
    ].sort())
    expect(payload.realtime_channels).toEqual(result.channels)
    expect(payload.app_role).toBe(UserRole.admin)
    expect(decoded.header).toMatchObject({ alg: 'ES256', kid: 'foodflow-test-es256' })
    expect(result.expiresAt).toMatch(/Z$/)
  })

  it('adds order and restaurant-driver chat channels only after access checks', async () => {
    prisma.order.findUnique.mockResolvedValueOnce({
      customerId: customerUuid(2),
      driverId: customerUuid(3),
      restaurantId: customerUuid(4),
    })
    prisma.restaurantProfile.findFirst.mockResolvedValueOnce({ id: customerUuid(5) })
    const service = new RealtimeTokenService(config as never, prisma as never)

    const result = await service.issueToken(
      { sub: customerUuid(6), role: UserRole.restaurant },
      { orderId: customerUuid(7) },
    )

    expect(result.channels).toContain(`private:order:${customerUuid(7)}`)
    expect(result.channels).toContain(`private:order:${customerUuid(7)}:restaurant-driver`)
    expect(prisma.restaurantProfile.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: customerUuid(6),
        restaurantId: customerUuid(4),
        isActive: true,
      }),
    }))
  })

  it('rejects requested restaurant channels outside the authenticated restaurant scope', async () => {
    prisma.restaurantProfile.findFirst.mockResolvedValueOnce(null)
    const service = new RealtimeTokenService(config as never, prisma as never)

    await expect(
      service.issueToken(
        { sub: customerUuid(6), role: UserRole.restaurant },
        { restaurantId: customerUuid(4) },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('fails closed when Supabase JWT signing secret is missing', async () => {
    const service = new RealtimeTokenService(
      { get: jest.fn(() => undefined) } as never,
      prisma as never,
    )

    await expect(service.issueToken({ sub: customerUuid(1), role: UserRole.admin }))
      .rejects.toBeInstanceOf(InternalServerErrorException)
  })
})

function customerUuid(n: number): string {
  return `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`
}
