import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { KycStatus, Prisma, VehicleType } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { EventType } from '../notifications/notifications.constants'
import { NotificationsService } from '../notifications/notifications.service'
import { DriverKycStorageService } from './driver-kyc-storage.service'
import {
  kycDocumentObjectsSchema,
  type CreateKycUploadInput,
  type KycDocumentObjects,
  type SubmitDriverKycInput,
} from './driver-kyc.zod'

const DEFAULT_KYC_RETRY_LIMIT = 3

@Injectable()
export class DriverKycService {
  private readonly logger = new Logger(DriverKycService.name)
  private readonly retryLimit: number

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: DriverKycStorageService,
    private readonly notifications: NotificationsService,
    config: ConfigService,
  ) {
    const configured = Number(config.get<string | number>('DRIVER_KYC_RETRY_LIMIT'))
    this.retryLimit = Number.isInteger(configured) && configured >= 1 && configured <= 10
      ? configured
      : DEFAULT_KYC_RETRY_LIMIT
  }

  async createUploadGrant(driverId: string, input: CreateKycUploadInput) {
    const profile = await this.requireDriverProfile(driverId)
    await this.assertCanSubmit(profile.id, profile.isVerified, profile.termsAcceptedAt)
    return this.storage.createUploadGrant(
      driverId,
      input.documentType,
      input.contentType,
      input.sizeBytes,
    )
  }

  async submit(driverId: string, input: SubmitDriverKycInput) {
    const profile = await this.requireDriverProfile(driverId)
    await this.assertCanSubmit(profile.id, profile.isVerified, profile.termsAcceptedAt)
    await this.storage.validateSubmissionObjects(driverId, input.documents)

    try {
      return await this.prisma.$transaction(async tx => {
        const freshProfile = await tx.driverProfile.findUnique({
          where: { userId: driverId },
          select: { id: true, isVerified: true, termsAcceptedAt: true },
        })
        if (!freshProfile) throw new NotFoundException('DRIVER_PROFILE_NOT_FOUND')
        await this.assertCanSubmitWithClient(
          tx,
          freshProfile.id,
          freshProfile.isVerified,
          freshProfile.termsAcceptedAt,
        )

        const submission = await tx.driverKycSubmission.create({
          data: {
            driverProfileId: freshProfile.id,
            documentUrls: input.documents as Prisma.InputJsonObject,
          },
          select: { id: true, status: true, createdAt: true },
        })
        await tx.driverProfile.update({
          where: { id: freshProfile.id },
          data: {
            licenseNumber: input.licenseNumber,
            vehicleType: input.vehicleType as VehicleType,
            vehiclePlate: input.vehiclePlate,
            isVerified: false,
            isOnline: false,
          },
        })

        return {
          submissionId: submission.id,
          status: submission.status,
          submittedAt: submission.createdAt.toISOString(),
        }
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('KYC_SUBMISSION_ALREADY_PENDING')
      }
      throw error
    }
  }

  async getStatus(driverId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
      select: {
        isVerified: true,
        licenseNumber: true,
        vehicleType: true,
        vehiclePlate: true,
        termsAcceptedAt: true,
        termsVersion: true,
        kycSubmissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            rejectionReason: true,
            reviewedAt: true,
            createdAt: true,
          },
        },
        _count: { select: { kycSubmissions: true } },
      },
    })
    if (!profile) throw new NotFoundException('DRIVER_PROFILE_NOT_FOUND')
    const latest = profile.kycSubmissions[0]

    return {
      isVerified: profile.isVerified,
      status: profile.isVerified ? KycStatus.approved : latest?.status ?? 'not_submitted',
      licenseNumber: profile.licenseNumber,
      vehicleType: profile.vehicleType,
      vehiclePlate: profile.vehiclePlate,
      termsAcceptedAt: profile.termsAcceptedAt?.toISOString() ?? null,
      termsVersion: profile.termsVersion,
      latestSubmission: latest ? {
        id: latest.id,
        status: latest.status,
        rejectionReason: latest.rejectionReason,
        submittedAt: latest.createdAt.toISOString(),
        reviewedAt: latest.reviewedAt?.toISOString() ?? null,
      } : null,
      attemptsRemaining: Math.max(0, this.retryLimit - profile._count.kycSubmissions),
    }
  }

  async getAdminSubmissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { driverProfile: { select: { id: true } } },
    })
    if (!user) throw new NotFoundException('USER_NOT_FOUND')
    if (!user.driverProfile) {
      return { available: false as const, reason: 'NOT_A_DRIVER' as const }
    }

    const submissions = await this.prisma.driverKycSubmission.findMany({
      where: { driverProfileId: user.driverProfile.id },
      orderBy: { createdAt: 'desc' },
    })
    return {
      available: true as const,
      submissions: await Promise.all(submissions.map(async submission => {
        const documents = parseKycDocumentObjects(submission.documentUrls)
        return {
          id: submission.id,
          status: submission.status,
          rejectionReason: submission.rejectionReason,
          reviewedById: submission.reviewedById,
          reviewedAt: submission.reviewedAt,
          createdAt: submission.createdAt,
          updatedAt: submission.updatedAt,
          documentsAvailable: documents !== null,
          documentUrls: documents
            ? await this.storage.createSignedReadUrls(userId, documents)
            : null,
        }
      })),
    }
  }

  async review(
    userId: string,
    submissionId: string,
    status: Exclude<KycStatus, 'pending'>,
    adminId: string,
    reason?: string,
  ) {
    const normalizedReason = reason?.trim()
    if (status === KycStatus.rejected && !normalizedReason) {
      throw new BadRequestException('KYC_REJECTION_REASON_REQUIRED')
    }

    const submission = await this.prisma.driverKycSubmission.findFirst({
      where: {
        id: submissionId,
        driverProfile: { userId },
      },
      include: { driverProfile: { select: { id: true, userId: true } } },
    })
    if (!submission) throw new NotFoundException('KYC_SUBMISSION_NOT_FOUND')
    if (submission.status !== KycStatus.pending) {
      throw new ConflictException('KYC_SUBMISSION_ALREADY_REVIEWED')
    }

    if (status === KycStatus.approved) {
      const documents = parseKycDocumentObjects(submission.documentUrls)
      if (!documents) throw new BadRequestException('KYC_DOCUMENT_MANIFEST_INVALID')
      await this.storage.validateSubmissionObjects(submission.driverProfile.userId, documents)
    }

    const result = await this.prisma.$transaction(async tx => {
      const updated = await tx.driverKycSubmission.updateMany({
        where: { id: submissionId, status: KycStatus.pending },
        data: {
          status,
          rejectionReason: status === KycStatus.rejected ? normalizedReason : null,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      })
      if (updated.count !== 1) throw new ConflictException('KYC_SUBMISSION_ALREADY_REVIEWED')
      await tx.driverProfile.update({
        where: { id: submission.driverProfile.id },
        data: { isVerified: status === KycStatus.approved, isOnline: false },
      })
      return tx.driverKycSubmission.findUniqueOrThrow({
        where: { id: submissionId },
        select: {
          id: true,
          status: true,
          rejectionReason: true,
          reviewedById: true,
          reviewedAt: true,
          updatedAt: true,
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    await this.sendReviewNotification(
      submission.driverProfile.userId,
      submissionId,
      status,
      normalizedReason,
    )
    return result
  }

  private async assertCanSubmit(
    profileId: string,
    isVerified: boolean,
    termsAcceptedAt: Date | null,
  ): Promise<void> {
    await this.assertCanSubmitWithClient(this.prisma, profileId, isVerified, termsAcceptedAt)
  }

  private async assertCanSubmitWithClient(
    client: Pick<PrismaService, 'driverKycSubmission'> | Prisma.TransactionClient,
    profileId: string,
    isVerified: boolean,
    termsAcceptedAt: Date | null,
  ): Promise<void> {
    if (!termsAcceptedAt) throw new BadRequestException('DRIVER_TERMS_NOT_ACCEPTED')
    if (isVerified) throw new ConflictException('DRIVER_ALREADY_VERIFIED')
    const [pending, attempts] = await Promise.all([
      client.driverKycSubmission.count({
        where: { driverProfileId: profileId, status: KycStatus.pending },
      }),
      client.driverKycSubmission.count({ where: { driverProfileId: profileId } }),
    ])
    if (pending > 0) throw new ConflictException('KYC_SUBMISSION_ALREADY_PENDING')
    if (attempts >= this.retryLimit) throw new ConflictException('KYC_RETRY_LIMIT_REACHED')
  }

  private async requireDriverProfile(driverId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
      select: { id: true, isVerified: true, termsAcceptedAt: true },
    })
    if (!profile) throw new NotFoundException('DRIVER_PROFILE_NOT_FOUND')
    return profile
  }

  private async sendReviewNotification(
    driverId: string,
    submissionId: string,
    status: Exclude<KycStatus, 'pending'>,
    reason?: string,
  ): Promise<void> {
    try {
      await this.notifications.fanout(
        driverId,
        status === KycStatus.approved ? EventType.KYC_APPROVED : EventType.KYC_REJECTED,
        {
          sourceId: submissionId,
          templateVars: { reason: reason ?? '' },
          data: { submissionId, status },
        },
      )
    } catch (error) {
      this.logger.error(`KYC review notification failed for submission ${submissionId}: ${errorMessage(error)}`)
    }
  }
}

export function parseKycDocumentObjects(value: Prisma.JsonValue): KycDocumentObjects | null {
  const parsed = kycDocumentObjectsSchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
