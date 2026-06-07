import { Test, TestingModule } from '@nestjs/testing'
import { WalletService } from './wallet.service'
import { PrismaService } from '../database/prisma.service'

const mockPrisma = { $queryRaw: jest.fn() }

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
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ sum: BigInt(1500) }])
        .mockResolvedValueOnce([
          {
            id: 'txn-1',
            amount_delta: 1500,
            type: 'credit',
            reason: 'order_refund',
            ref_id: null,
            created_at: new Date('2026-06-01T00:00:00Z'),
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
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ sum: BigInt(0) }])
        .mockResolvedValueOnce([])

      const snap = await service.getSnapshot(userId)

      expect(snap.balance).toBe(0)
      expect(snap.transactions).toHaveLength(0)
    })

    it('handles db error gracefully', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('db down'))

      const snap = await service.getSnapshot(userId)

      expect(snap.balance).toBe(0)
      expect(snap.transactions).toHaveLength(0)
    })

    it('includes refId when present', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ sum: BigInt(200) }])
        .mockResolvedValueOnce([
          {
            id: 'txn-2',
            amount_delta: -200,
            type: 'debit',
            reason: 'withdrawal',
            ref_id: 'ref-uuid-123',
            created_at: new Date('2026-06-02T00:00:00Z'),
          },
        ])

      const snap = await service.getSnapshot(userId)

      expect(snap.transactions[0].type).toBe('debit')
      expect(snap.transactions[0].refId).toBe('ref-uuid-123')
    })
  })
})
