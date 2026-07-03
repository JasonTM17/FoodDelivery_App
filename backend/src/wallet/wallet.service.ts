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
    const result = await this.prisma.walletTransaction.aggregate({
      where: { userId },
      _sum: { amountDelta: true },
    })
    return result._sum.amountDelta ?? 0
  }

  private async fetchRecentTransactions(userId: string): Promise<WalletTransaction[]> {
    const rows = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return rows.map((r) => ({
      id: r.id,
      amountDelta: r.amountDelta,
      type: r.type,
      reason: r.reason,
      ...(r.refId ? { refId: r.refId } : {}),
      createdAt: r.createdAt.toISOString(),
    }))
  }
}
