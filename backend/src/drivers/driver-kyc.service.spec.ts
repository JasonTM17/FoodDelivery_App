import { BadRequestException, ConflictException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { KycStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { EventType } from '../notifications/notifications.constants'
import { NotificationsService } from '../notifications/notifications.service'
import { DriverKycStorageService } from './driver-kyc-storage.service'
import { DriverKycService, parseKycDocumentObjects } from './driver-kyc.service'
import type { KycDocumentObjects, SubmitDriverKycInput } from './driver-kyc.zod'

describe('DriverKycService', () => {
  const documents = makeDocuments('driver-1')
  const prisma = {
    driverProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    driverKycSubmission: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  }
  const storage = {
    createUploadGrant: jest.fn(),
    validateSubmissionObjects: jest.fn(),
    createSignedReadUrls: jest.fn(),
  }
  const notifications = { fanout: jest.fn() }
  let service: DriverKycService

  beforeEach(() => {
    jest.clearAllMocks()
    prisma.$transaction.mockImplementation(async (callback: (client: typeof prisma) => unknown) => callback(prisma))
    prisma.driverKycSubmission.count.mockResolvedValue(0)
    storage.validateSubmissionObjects.mockResolvedValue(undefined)
    notifications.fanout.mockResolvedValue({ sent: true })
    service = new DriverKycService(
      prisma as unknown as PrismaService,
      storage as unknown as DriverKycStorageService,
      notifications as unknown as NotificationsService,
      { get: jest.fn(() => 3) } as unknown as ConfigService,
    )
  })

  it('requires accepted driver terms before issuing a private upload grant', async () => {
    prisma.driverProfile.findUnique.mockResolvedValueOnce({
      id: 'profile-1',
      isVerified: false,
      termsAcceptedAt: null,
    })

    await expect(service.createUploadGrant('driver-1', {
      documentType: 'idCardFront',
      contentType: 'image/jpeg',
      sizeBytes: 1024,
    })).rejects.toThrow(new BadRequestException('DRIVER_TERMS_NOT_ACCEPTED'))
    expect(storage.createUploadGrant).not.toHaveBeenCalled()
  })

  it('persists a validated pending manifest and vehicle identity atomically', async () => {
    const profile = { id: 'profile-1', isVerified: false, termsAcceptedAt: new Date() }
    prisma.driverProfile.findUnique.mockResolvedValue(profile)
    prisma.driverKycSubmission.create.mockResolvedValue({
      id: 'submission-1',
      status: KycStatus.pending,
      createdAt: new Date('2026-07-10T14:00:00.000Z'),
    })
    prisma.driverProfile.update.mockResolvedValue({ id: 'profile-1' })

    const result = await service.submit('driver-1', makeInput(documents))

    expect(storage.validateSubmissionObjects).toHaveBeenCalledWith('driver-1', documents)
    expect(prisma.driverKycSubmission.create).toHaveBeenCalledWith({
      data: { driverProfileId: 'profile-1', documentUrls: documents },
      select: { id: true, status: true, createdAt: true },
    })
    expect(prisma.driverProfile.update).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
      data: {
        licenseNumber: 'A1-123456789',
        vehicleType: 'motorbike',
        vehiclePlate: '59-F1-12345',
        isVerified: false,
        isOnline: false,
      },
    })
    expect(result).toEqual({
      submissionId: 'submission-1',
      status: 'pending',
      submittedAt: '2026-07-10T14:00:00.000Z',
    })
  })

  it('rejects duplicate pending submissions before validating storage again', async () => {
    prisma.driverProfile.findUnique.mockResolvedValueOnce({
      id: 'profile-1',
      isVerified: false,
      termsAcceptedAt: new Date(),
    })
    prisma.driverKycSubmission.count
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)

    await expect(service.submit('driver-1', makeInput(documents)))
      .rejects.toThrow(new ConflictException('KYC_SUBMISSION_ALREADY_PENDING'))
    expect(storage.validateSubmissionObjects).not.toHaveBeenCalled()
  })

  it('returns status without exposing private object keys', async () => {
    prisma.driverProfile.findUnique.mockResolvedValueOnce({
      isVerified: false,
      licenseNumber: 'A1-123456789',
      vehicleType: 'motorbike',
      vehiclePlate: '59-F1-12345',
      termsAcceptedAt: new Date('2026-07-10T10:00:00.000Z'),
      termsVersion: 'driver-terms-2026-07',
      kycSubmissions: [{
        id: 'submission-1',
        status: 'rejected',
        rejectionReason: 'Image is blurred',
        reviewedAt: new Date('2026-07-10T13:00:00.000Z'),
        createdAt: new Date('2026-07-10T11:00:00.000Z'),
      }],
      _count: { kycSubmissions: 1 },
    })

    const result = await service.getStatus('driver-1')

    expect(result).toMatchObject({
      status: 'rejected',
      attemptsRemaining: 2,
      latestSubmission: { rejectionReason: 'Image is blurred' },
    })
    expect(JSON.stringify(result)).not.toContain('kyc/driver-1/')
  })

  it('signs private document keys only for the admin resource response', async () => {
    prisma.user.findUnique.mockResolvedValueOnce({ driverProfile: { id: 'profile-1' } })
    prisma.driverKycSubmission.findMany.mockResolvedValueOnce([{
      id: 'submission-1',
      status: KycStatus.pending,
      documentUrls: documents,
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
      createdAt: new Date('2026-07-10T11:00:00.000Z'),
      updatedAt: new Date('2026-07-10T11:00:00.000Z'),
    }])
    storage.createSignedReadUrls.mockResolvedValueOnce({
      idCardFront: 'https://signed.test/front',
      idCardBack: 'https://signed.test/back',
      driverLicense: 'https://signed.test/license',
      vehicleRegistration: 'https://signed.test/registration',
    })

    const result = await service.getAdminSubmissions('driver-1')

    if (!result.available) throw new Error('Expected driver submissions')
    expect(result.submissions[0]).toMatchObject({
      documentsAvailable: true,
      documentUrls: { idCardFront: 'https://signed.test/front' },
    })
    expect(storage.createSignedReadUrls).toHaveBeenCalledWith('driver-1', documents)
    expect(JSON.stringify(result)).not.toContain('kyc/driver-1/')
  })

  it('approves one pending submission, verifies the profile, and emits a notification', async () => {
    prisma.driverKycSubmission.findFirst.mockResolvedValueOnce({
      id: 'submission-1',
      status: KycStatus.pending,
      documentUrls: documents,
      driverProfile: { id: 'profile-1', userId: 'driver-1' },
    })
    prisma.driverKycSubmission.updateMany.mockResolvedValueOnce({ count: 1 })
    prisma.driverProfile.update.mockResolvedValueOnce({ id: 'profile-1' })
    prisma.driverKycSubmission.findUniqueOrThrow.mockResolvedValueOnce({
      id: 'submission-1',
      status: KycStatus.approved,
    })

    await expect(service.review(
      'driver-1',
      'submission-1',
      KycStatus.approved,
      'admin-1',
    )).resolves.toMatchObject({ status: KycStatus.approved })

    expect(storage.validateSubmissionObjects).toHaveBeenCalledWith('driver-1', documents)
    expect(prisma.driverProfile.update).toHaveBeenCalledWith({
      where: { id: 'profile-1' },
      data: { isVerified: true, isOnline: false },
    })
    expect(prisma.driverKycSubmission.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'submission-1' },
      select: {
        id: true,
        status: true,
        rejectionReason: true,
        reviewedById: true,
        reviewedAt: true,
        updatedAt: true,
      },
    })
    expect(notifications.fanout).toHaveBeenCalledWith(
      'driver-1',
      EventType.KYC_APPROVED,
      expect.objectContaining({ sourceId: 'submission-1' }),
    )
  })

  it('requires an explicit reason for KYC rejection', async () => {
    await expect(service.review(
      'driver-1',
      'submission-1',
      KycStatus.rejected,
      'admin-1',
      ' ',
    )).rejects.toThrow(new BadRequestException('KYC_REJECTION_REASON_REQUIRED'))
    expect(prisma.driverKycSubmission.findFirst).not.toHaveBeenCalled()
  })

  it('allows an admin to reject a legacy malformed manifest without signing it', async () => {
    prisma.driverKycSubmission.findFirst.mockResolvedValueOnce({
      id: 'submission-legacy',
      status: KycStatus.pending,
      documentUrls: { idCardFront: 'https://legacy-public.test/front.jpg' },
      driverProfile: { id: 'profile-1', userId: 'driver-1' },
    })
    prisma.driverKycSubmission.updateMany.mockResolvedValueOnce({ count: 1 })
    prisma.driverProfile.update.mockResolvedValueOnce({ id: 'profile-1' })
    prisma.driverKycSubmission.findUniqueOrThrow.mockResolvedValueOnce({
      id: 'submission-legacy',
      status: KycStatus.rejected,
    })

    await expect(service.review(
      'driver-1',
      'submission-legacy',
      KycStatus.rejected,
      'admin-1',
      'Legacy document manifest is not reviewable',
    )).resolves.toMatchObject({ status: KycStatus.rejected })

    expect(storage.validateSubmissionObjects).not.toHaveBeenCalled()
    expect(notifications.fanout).toHaveBeenCalledWith(
      'driver-1',
      EventType.KYC_REJECTED,
      expect.objectContaining({ sourceId: 'submission-legacy' }),
    )
  })

  it('rejects legacy public URL manifests instead of exposing them', () => {
    expect(parseKycDocumentObjects({
      idCardFront: 'https://public.test/front.jpg',
      idCardBack: 'https://public.test/back.jpg',
      driverLicense: 'https://public.test/license.jpg',
      vehicleRegistration: 'https://public.test/registration.jpg',
    })).toBeNull()
  })
})

function makeInput(documents: KycDocumentObjects): SubmitDriverKycInput {
  return {
    licenseNumber: 'A1-123456789',
    vehicleType: 'motorbike',
    vehiclePlate: '59-F1-12345',
    documents,
  }
}

function makeDocuments(driverId: string): KycDocumentObjects {
  const prefix = `kyc/${driverId}/1730000000000-0123456789abcdef01234567`
  return {
    idCardFront: `${prefix}-idCardFront.jpg`,
    idCardBack: `${prefix}-idCardBack.jpg`,
    driverLicense: `${prefix}-driverLicense.jpg`,
    vehicleRegistration: `${prefix}-vehicleRegistration.jpg`,
  }
}
