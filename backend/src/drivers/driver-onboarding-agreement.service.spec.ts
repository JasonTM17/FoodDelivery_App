import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { DriverOnboardingAgreementService } from './driver-onboarding-agreement.service'

describe('DriverOnboardingAgreementService', () => {
  const acceptedAt = new Date('2026-07-03T12:00:00Z')
  const prisma = {
    driverProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService & {
    driverProfile: { findUnique: jest.Mock; update: jest.Mock }
  }
  let service: DriverOnboardingAgreementService

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers().setSystemTime(acceptedAt)
    service = new DriverOnboardingAgreementService(prisma)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('persists driver agreement acceptance on the authenticated driver profile', async () => {
    prisma.driverProfile.findUnique.mockResolvedValueOnce({ userId: 'driver-1' })
    prisma.driverProfile.update.mockResolvedValueOnce({
      termsAcceptedAt: acceptedAt,
      termsVersion: 'driver-terms-2026-07',
    })

    const result = await service.accept('driver-1', { termsVersion: ' driver-terms-2026-07 ' })

    expect(prisma.driverProfile.update).toHaveBeenCalledWith({
      where: { userId: 'driver-1' },
      data: {
        termsAcceptedAt: acceptedAt,
        termsVersion: 'driver-terms-2026-07',
      },
      select: {
        termsAcceptedAt: true,
        termsVersion: true,
      },
    })
    expect(result).toEqual({
      termsAcceptedAt: acceptedAt.toISOString(),
      termsVersion: 'driver-terms-2026-07',
    })
  })

  it('rejects acceptance when no driver profile exists', async () => {
    prisma.driverProfile.findUnique.mockResolvedValueOnce(null)

    await expect(service.accept('user-1', { termsVersion: 'driver-terms-2026-07' })).rejects.toThrow(
      NotFoundException,
    )
    expect(prisma.driverProfile.update).not.toHaveBeenCalled()
  })
})
