import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { randomBytes } from 'crypto'

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

    // Auto-generate 8-char hex code; retry once on unique-code collision
    for (let attempt = 0; attempt < 2; attempt++) {
      const newCode = this.generateCode()
      try {
        const created = await this.prisma.referralCode.upsert({
          where: { userId },
          create: { userId, code: newCode },
          update: {},
          select: { code: true },
        })
        return created.code
      } catch {
        // continue to retry
      }
    }

    // Final fallback — read whatever landed in DB (race winner)
    const final = await this.prisma.referralCode.findUnique({
      where: { userId },
      select: { code: true },
    })
    return final?.code ?? this.generateCode()
  }

  private async fetchStats(
    userId: string,
  ): Promise<{ inviteesCount: number; rewardsEarned: number }> {
    try {
      const result = await this.prisma.referralRedemption.aggregate({
        where: { referrerUserId: userId },
        _count: { _all: true },
        _sum: { rewardAmount: true },
      })
      return {
        inviteesCount: result._count._all,
        rewardsEarned: result._sum.rewardAmount ?? 0,
      }
    } catch {
      return { inviteesCount: 0, rewardsEarned: 0 }
    }
  }

  private generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase()
  }
}
