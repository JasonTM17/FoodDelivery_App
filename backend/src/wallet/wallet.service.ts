import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

export interface WalletTransaction {
  id: string
  amountDelta: number
  type: 'credit' | 'debit'
  reason: string
  refId?: string
  createdAt: string
}

export interface WalletSnapshot {
  balance: number
  transactions: WalletTransaction[]
}

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getSnapshot(userId: string): Promise<WalletSnapshot> {
    const balance = await this.computeBalance(userId)
    const transactions = await this.fetchRecentTransactions(userId)
    return { balance, transactions }
  }

  private async computeBalance(userId: string): Promise<number> {
    try {
      const rows = await this.prisma.$queryRaw<{ sum: bigint | null }[]>`
        SELECT COALESCE(SUM(amount_delta), 0) AS sum
        FROM wallet_transactions
        WHERE user_id = ${userId}::uuid
      `
      return Number(rows[0]?.sum ?? 0)
    } catch {
      return 0
    }
  }

  private async fetchRecentTransactions(userId: string): Promise<WalletTransaction[]> {
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          id: string
          amount_delta: number
          type: string
          reason: string
          ref_id: string | null
          created_at: Date
        }>
      >`
        SELECT id, amount_delta, type, reason, ref_id, created_at
        FROM wallet_transactions
        WHERE user_id = ${userId}::uuid
        ORDER BY created_at DESC
        LIMIT 50
      `
      return rows.map((r) => ({
        id: r.id,
        amountDelta: r.amount_delta,
        type: r.type === 'debit' ? 'debit' : 'credit',
        reason: r.reason,
        ...(r.ref_id ? { refId: r.ref_id } : {}),
        createdAt: r.created_at.toISOString(),
      }))
    } catch {
      return []
    }
  }
}
