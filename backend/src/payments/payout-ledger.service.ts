import { Injectable } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

export type RecipientType = 'restaurant' | 'driver' | 'platform'

export interface LedgerEntryInput {
  dedupeKey: string
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
    await this.prisma.payoutLedger.createMany({
      data: [{
        dedupeKey: entry.dedupeKey,
        orderId: entry.orderId,
        recipientType: entry.recipientType,
        recipientId: entry.recipientId ?? null,
        amount: entry.amount,
        currency: entry.currency ?? 'VND',
        status: 'pending',
      }],
      skipDuplicates: true,
    })
  }

  async insertEntries(entries: LedgerEntryInput[]): Promise<void> {
    if (entries.length === 0) return
    await this.prisma.payoutLedger.createMany({
      data: entries.map(e => ({
        dedupeKey: e.dedupeKey,
        orderId: e.orderId,
        recipientType: e.recipientType,
        recipientId: e.recipientId ?? null,
        amount: e.amount,
        currency: e.currency ?? 'VND',
        status: 'pending',
      })),
      skipDuplicates: true,
    })
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
