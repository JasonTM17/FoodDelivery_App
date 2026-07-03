import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { AcceptDriverAgreementInput } from './driver-onboarding-agreement.zod'

export interface DriverAgreementAcceptanceView {
  termsAcceptedAt: string
  termsVersion: string
}

@Injectable()
export class DriverOnboardingAgreementService {
  constructor(private readonly prisma: PrismaService) {}

  async accept(driverId: string, input: AcceptDriverAgreementInput): Promise<DriverAgreementAcceptanceView> {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId: driverId },
      select: { userId: true },
    })
    if (!profile) throw new NotFoundException('DRIVER_PROFILE_NOT_FOUND')

    const acceptedAt = new Date()
    const updated = await this.prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        termsAcceptedAt: acceptedAt,
        termsVersion: input.termsVersion.trim(),
      },
      select: {
        termsAcceptedAt: true,
        termsVersion: true,
      },
    })

    return {
      termsAcceptedAt: updated.termsAcceptedAt?.toISOString() ?? acceptedAt.toISOString(),
      termsVersion: updated.termsVersion ?? input.termsVersion.trim(),
    }
  }
}
