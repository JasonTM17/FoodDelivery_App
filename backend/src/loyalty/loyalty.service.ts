import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

export interface LoyaltyTransaction {
  id: string
  points: number
  type: 'credit' | 'debit'
  description: string
  createdAt: string
}

export interface LoyaltySnapshot {
  totalPoints: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  pointsToNextTier: number
  transactions: LoyaltyTransaction[]
}

const TIER_THRESHOLDS: Array<{ tier: LoyaltySnapshot['tier']; min: number }> = [
  { tier: 'platinum', min: 5000 },
  { tier: 'gold', min: 2000 },
  { tier: 'silver', min: 500 },
  { tier: 'bronze', min: 0 },
]

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(userId: string): Promise<LoyaltySnapshot> {
    const totalPoints = await this.computeTotalPoints(userId)
    const { tier, pointsToNextTier } = this.classifyTier(totalPoints)
    const transactions = await this.fetchRecentTransactions(userId)
    return { totalPoints, tier, pointsToNextTier, transactions }
  }

  private async computeTotalPoints(userId: string): Promise<number> {
    try {
      const [credits, debits] = await Promise.all([
        this.prisma.loyaltyTransaction.aggregate({
          where: { userId, type: 'credit' },
          _sum: { points: true },
        }),
        this.prisma.loyaltyTransaction.aggregate({
          where: { userId, type: 'debit' },
          _sum: { points: true },
        }),
      ])
      const creditTotal = credits._sum.points ?? 0
      const debitTotal = debits._sum.points ?? 0
      return creditTotal - debitTotal
    } catch {
      return 0
    }
  }

  private async fetchRecentTransactions(
    userId: string,
  ): Promise<LoyaltyTransaction[]> {
    try {
      const rows = await this.prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return rows.map((r) => ({
        id: r.id,
        points: r.points,
        type: r.type,
        description: r.description,
        createdAt: r.createdAt.toISOString(),
      }))
    } catch {
      return []
    }
  }

  private classifyTier(points: number): {
    tier: LoyaltySnapshot['tier']
    pointsToNextTier: number
  } {
    for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
      const cur = TIER_THRESHOLDS[i]
      if (points >= cur.min) {
        const next = TIER_THRESHOLDS[i - 1]
        return {
          tier: cur.tier,
          pointsToNextTier: next ? next.min - points : 0,
        }
      }
    }
    return { tier: 'bronze', pointsToNextTier: 500 }
  }
}
