import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { PrismaService } from '../database/prisma.service'

export interface ReferralSnapshot {
  code: string
  inviteesCount: number
  rewardsEarned: number
}

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSnapshot(userId: string): Promise<ReferralSnapshot> {
    const code = await this.getOrCreateCode(userId)
    const { inviteesCount, rewardsEarned } = await this.fetchStats(userId)
    return { code, inviteesCount, rewardsEarned }
  }

  private async getOrCreateCode(userId: string): Promise<string> {
    const existing = await this.prisma.referralCode.findUnique({
      where: { userId },
      select: { code: true },
    })
    if (existing) return existing.code

    for (let attempt = 0; attempt < 5; attempt++) {
      const newCode = this.generateCode()
      try {
        const created = await this.prisma.referralCode.upsert({
          where: { userId },
          create: { userId, code: newCode },
          update: {},
          select: { code: true },
        })
        return created.code
      } catch (error) {
        if (!isUniqueConstraintViolation(error)) throw error

        const raceWinner = await this.prisma.referralCode.findUnique({
          where: { userId },
          select: { code: true },
        })
        if (raceWinner) return raceWinner.code
      }
    }

    throw new ServiceUnavailableException('REFERRAL_CODE_ALLOCATION_FAILED')
  }

  private async fetchStats(
    userId: string,
  ): Promise<{ inviteesCount: number; rewardsEarned: number }> {
    const result = await this.prisma.referralRedemption.aggregate({
      where: { referrerUserId: userId },
      _count: { _all: true },
      _sum: { rewardAmount: true },
    })
    return {
      inviteesCount: result._count._all,
      rewardsEarned: result._sum.rewardAmount ?? 0,
    }
  }

  private generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase()
  }
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === 'P2002'
}
