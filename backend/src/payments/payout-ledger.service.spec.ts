import { Test, TestingModule } from '@nestjs/testing'
import { PayoutLedgerService } from './payout-ledger.service'
import { PrismaService } from '../database/prisma.service'

describe('PayoutLedgerService', () => {
  let service: PayoutLedgerService

  const mockPrisma = {
    payoutLedger: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayoutLedgerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get(PayoutLedgerService)
    jest.clearAllMocks()
  })

  describe('insertEntry', () => {
    it('creates a pending ledger entry with defaults', async () => {
      await service.insertEntry({
        dedupeKey: 'commission-order-1-restaurant',
        orderId: 'order-1',
        recipientType: 'restaurant',
        recipientId: 'rest-1',
        amount: 64_000,
      })

      expect(mockPrisma.payoutLedger.createMany).toHaveBeenCalledWith({
        data: [{
          dedupeKey: 'commission-order-1-restaurant',
          orderId: 'order-1',
          recipientType: 'restaurant',
          recipientId: 'rest-1',
          amount: 64_000,
          currency: 'VND',
          status: 'pending',
        }],
        skipDuplicates: true,
      })
    })

    it('uses provided currency', async () => {
      await service.insertEntry({
        dedupeKey: 'commission-order-2-platform',
        orderId: 'order-2',
        recipientType: 'platform',
        amount: 5_000,
        currency: 'USD',
      })

      expect(mockPrisma.payoutLedger.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([expect.objectContaining({ currency: 'USD' })]),
        }),
      )
    })
  })

  describe('insertEntries', () => {
    it('skips createMany when entries array is empty', async () => {
      await service.insertEntries([])
      expect(mockPrisma.payoutLedger.createMany).not.toHaveBeenCalled()
    })

    it('bulk-creates multiple entries', async () => {
      await service.insertEntries([
        { dedupeKey: 'commission-o1-restaurant', orderId: 'o1', recipientType: 'restaurant', amount: 64_000 },
        { dedupeKey: 'commission-o1-driver', orderId: 'o1', recipientType: 'driver', amount: 17_000 },
      ])

      expect(mockPrisma.payoutLedger.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ recipientType: 'restaurant', amount: 64_000 }),
          expect.objectContaining({ recipientType: 'driver', amount: 17_000 }),
        ]),
        skipDuplicates: true,
      })
    })
  })

  describe('markSettled', () => {
    it('updates matching entries to settled', async () => {
      const ids = ['id-1', 'id-2']
      const batchId = 'batch-001'

      await service.markSettled(ids, batchId)

      expect(mockPrisma.payoutLedger.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ids } },
        data: expect.objectContaining({
          status: 'settled',
          settlementBatchId: batchId,
          settledAt: expect.any(Date),
        }),
      })
    })
  })
})
