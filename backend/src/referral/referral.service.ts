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
    const rows = await this.prisma.$queryRaw<Array<{ code: string }>>`
      SELECT code FROM referral_codes WHERE user_id = ${userId}::uuid LIMIT 1
    `
    if (rows.length > 0) return rows[0].code

    // Auto-generate an 8-char uppercase code; retry once on collision
    const newCode = this.generateCode()
    try {
      await this.prisma.$executeRaw`
        INSERT INTO referral_codes (user_id, code)
        VALUES (${userId}::uuid, ${newCode})
        ON CONFLICT (user_id) DO NOTHING
      `
      // Re-read in case another request won the race
      const inserted = await this.prisma.$queryRaw<Array<{ code: string }>>`
        SELECT code FROM referral_codes WHERE user_id = ${userId}::uuid LIMIT 1
      `
      return inserted[0]?.code ?? newCode
    } catch {
      // Conflict on unique code — retry with fresh value
      const fallback = this.generateCode()
      await this.prisma.$executeRaw`
        INSERT INTO referral_codes (user_id, code)
        VALUES (${userId}::uuid, ${fallback})
        ON CONFLICT (user_id) DO NOTHING
      `
      const final = await this.prisma.$queryRaw<Array<{ code: string }>>`
        SELECT code FROM referral_codes WHERE user_id = ${userId}::uuid LIMIT 1
      `
      return final[0]?.code ?? fallback
    }
  }

  private async fetchStats(
    userId: string,
  ): Promise<{ inviteesCount: number; rewardsEarned: number }> {
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{ invitees_count: bigint; rewards_earned: bigint }>
      >`
        SELECT
          COUNT(*) AS invitees_count,
          COALESCE(SUM(reward_amount), 0) AS rewards_earned
        FROM referral_redemptions
        WHERE referrer_user_id = ${userId}::uuid
      `
      return {
        inviteesCount: Number(rows[0]?.invitees_count ?? 0),
        rewardsEarned: Number(rows[0]?.rewards_earned ?? 0),
      }
    } catch {
      return { inviteesCount: 0, rewardsEarned: 0 }
    }
  }

  private generateCode(): string {
    return randomBytes(4).toString('hex').toUpperCase()
  }
}
