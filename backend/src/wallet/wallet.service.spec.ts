import { Test, TestingModule } from '@nestjs/testing'
import { WalletService } from './wallet.service'
import { PrismaService } from '../database/prisma.service'

const mockPrisma = {
  walletTransaction: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
}

describe('WalletService', () => {
  let service: WalletService

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()
    service = module.get<WalletService>(WalletService)
  })

  const userId = 'a1b2c3d4-0000-0000-0000-000000000000'

  describe('getSnapshot', () => {
    it('returns balance and transactions', async () => {
      mockPrisma.walletTransaction.aggregate.mockResolvedValue({
        _sum: { amountDelta: 1500 },
      })
      mockPrisma.walletTransaction.findMany.mockResolvedValue([
        {
          id: 'txn-1',
          userId,
          amountDelta: 1500,
          type: 'credit',
          reason: 'order_refund',
          refId: null,
          createdAt: new Date('2026-06-01T00:00:00Z'),
        },
      ])

      const snap = await service.getSnapshot(userId)

      expect(snap.balance).toBe(1500)
      expect(snap.transactions).toHaveLength(1)
      expect(snap.transactions[0]).toEqual({
        id: 'txn-1',
        amountDelta: 1500,
        type: 'credit',
        reason: 'order_refund',
        createdAt: '2026-06-01T00:00:00.000Z',
      })
    })

    it('returns zero balance when table empty', async () => {
      mockPrisma.walletTransaction.aggregate.mockResolvedValue({
        _sum: { amountDelta: null },
      })
      mockPrisma.walletTransaction.findMany.mockResolvedValue([])

      const snap = await service.getSnapshot(userId)

      expect(snap.balance).toBe(0)
      expect(snap.transactions).toHaveLength(0)
    })

    it('propagates db errors instead of returning a fake empty wallet', async () => {
      mockPrisma.walletTransaction.aggregate.mockRejectedValue(new Error('db down'))
      mockPrisma.walletTransaction.findMany.mockRejectedValue(new Error('db down'))

      await expect(service.getSnapshot(userId)).rejects.toThrow('db down')
    })

    it('includes refId when present', async () => {
      mockPrisma.walletTransaction.aggregate.mockResolvedValue({
        _sum: { amountDelta: 200 },
      })
      mockPrisma.walletTransaction.findMany.mockResolvedValue([
        {
          id: 'txn-2',
          userId,
          amountDelta: -200,
          type: 'debit',
          reason: 'withdrawal',
          refId: 'ref-uuid-123',
          createdAt: new Date('2026-06-02T00:00:00Z'),
        },
      ])

      const snap = await service.getSnapshot(userId)

      expect(snap.transactions[0].type).toBe('debit')
      expect(snap.transactions[0].refId).toBe('ref-uuid-123')
    })
  })
})
