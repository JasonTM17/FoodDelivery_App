import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

export type RecipientType = 'restaurant' | 'driver' | 'platform'

export interface LedgerEntryInput {
  orderId: string
  recipientType: RecipientType
  recipientId?: string
  amount: number
  currency?: string
}

@Injectable()
export class PayoutLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async insertEntry(entry: LedgerEntryInput): Promise<void> {
    await this.prisma.payoutLedger.create({
      data: {
        orderId: entry.orderId,
        recipientType: entry.recipientType,
        recipientId: entry.recipientId ?? null,
        amount: entry.amount,
        currency: entry.currency ?? 'VND',
        status: 'pending',
      },
    })
  }

  async insertEntries(entries: LedgerEntryInput[]): Promise<void> {
    if (entries.length === 0) return
    // Idempotent per (orderId, recipientType, recipientId) — skip rows that already exist
    for (const e of entries) {
      const existing = await this.prisma.payoutLedger.findFirst({
        where: {
          orderId: e.orderId,
          recipientType: e.recipientType,
          recipientId: e.recipientId ?? null,
        },
      })
      if (existing) continue
      try {
        await this.prisma.payoutLedger.create({
          data: {
            orderId: e.orderId,
            recipientType: e.recipientType,
            recipientId: e.recipientId ?? null,
            amount: e.amount,
            currency: e.currency ?? 'VND',
            status: 'pending',
          },
        })
      } catch {
        // Concurrent insert with unique constraint — treat as already ledgered
      }
    }
  }

  /** True when restaurant+platform (and driver if assigned) already ledgered for order. */
  async hasSplitForOrder(orderId: string): Promise<boolean> {
    const count = await this.prisma.payoutLedger.count({ where: { orderId } })
    return count >= 2
  }

  async markSettled(ids: string[], settlementBatchId: string): Promise<void> {
    await this.prisma.payoutLedger.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'settled',
        settlementBatchId,
        settledAt: new Date(),
      },
    })
  }
}
