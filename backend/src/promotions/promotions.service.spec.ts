import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { PromotionsService } from './promotions.service'
import { EligibilityService } from './eligibility.service'
import { FraudDetectionService } from './fraud-detection.service'
import { PrismaService } from '../database/prisma.service'

const PROMO = {
  id: 'promo-uuid',
  code: 'SAVE10',
  name: 'Save ten percent',
  description: 'Customer promotion',
  type: 'percentage',
  status: 'active',
  value: 10,
  minOrderAmount: 0,
  maxDiscount: null,
  usageLimit: 1,
  usageCount: 0,
  currentUsageCount: 0,
  maxPerUser: null,
  firstOrderOnly: false,
  restaurantId: null,
  startsAt: new Date(Date.now() - 86400000),
  expiresAt: new Date(Date.now() + 86400000),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const CART = { subtotal: 100_000, restaurantId: 'rest-1' }
const USER_ID = 'user-uuid'
const ORDER_ID = 'order-uuid'
const FINGERPRINT = 'device-abc'

function makeTxMock(promoOverride = {}) {
  return {
    $executeRaw: jest.fn().mockResolvedValue(0),
    promotion: {
      findUnique: jest.fn().mockResolvedValue({ ...PROMO, ...promoOverride }),
      update: jest.fn().mockResolvedValue({}),
    },
    promotionUsage: {
      create: jest.fn().mockResolvedValue({}),
    },
  }
}

describe('PromotionsService', () => {
  let service: PromotionsService
  let eligibility: jest.Mocked<EligibilityService>
  let fraud: jest.Mocked<FraudDetectionService>
  let txMock: ReturnType<typeof makeTxMock>
  let prismaMock: {
    $transaction: jest.Mock
    promotion: { findUnique: jest.Mock; findMany: jest.Mock }
    promotionUsage: { groupBy: jest.Mock; findMany: jest.Mock }
    order: { count: jest.Mock }
  }

  beforeEach(async () => {
    txMock = makeTxMock()
    prismaMock = {
      $transaction: jest.fn().mockImplementation((fn: Function) => fn(txMock)),
      promotion: {
        findUnique: jest.fn().mockResolvedValue(PROMO),
        findMany: jest.fn().mockResolvedValue([]),
      },
      promotionUsage: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
      order: { count: jest.fn().mockResolvedValue(0) },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromotionsService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: EligibilityService,
          useValue: {
            validate: jest.fn().mockResolvedValue({ valid: true, discountAmount: 10_000 }),
          },
        },
        {
          provide: FraudDetectionService,
          useValue: {
            check: jest.fn().mockResolvedValue({ blocked: false, reason: '' }),
            record: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile()

    service = module.get(PromotionsService)
    eligibility = module.get(EligibilityService) as jest.Mocked<EligibilityService>
    fraud = module.get(FraudDetectionService) as jest.Mocked<FraudDetectionService>
  })

  describe('validateAndClaim', () => {
    it('throws BadRequestException when device is fraud-blocked', async () => {
      fraud.check.mockResolvedValueOnce({
        blocked: true,
        reason: 'Thiết bị đã sử dụng quá 3 mã',
      })
      await expect(
        service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID, FINGERPRINT),
      ).rejects.toThrow(BadRequestException)
    })

    it('throws NotFoundException when promotion code does not exist', async () => {
      txMock.promotion.findUnique.mockResolvedValueOnce(null)
      await expect(
        service.validateAndClaim('BADCODE', CART, USER_ID, ORDER_ID),
      ).rejects.toThrow(NotFoundException)
    })

    it('throws BadRequestException when eligibility fails', async () => {
      eligibility.validate.mockResolvedValueOnce({
        valid: false,
        error: 'Mã đã hết lượt dùng',
      })
      await expect(
        service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('returns discountAmount on successful claim', async () => {
      const result = await service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID)
      expect(result).toEqual({ discountAmount: 10_000 })
    })

    it('increments reporting and current usage counters in transaction', async () => {
      await service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID)
      expect(txMock.promotion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            usageCount: { increment: 1 },
            currentUsageCount: { increment: 1 },
          },
        }),
      )
    })

    it('inserts PromotionUsage record in transaction', async () => {
      await service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID)
      expect(txMock.promotionUsage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ promotionId: PROMO.id, userId: USER_ID, orderId: ORDER_ID }),
        }),
      )
    })

    it('records device fingerprint after successful claim', async () => {
      await service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID, FINGERPRINT)
      expect(fraud.record).toHaveBeenCalledWith(FINGERPRINT)
    })

    it('skips fraud check and record when no fingerprint provided', async () => {
      await service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID)
      expect(fraud.check).not.toHaveBeenCalled()
      expect(fraud.record).not.toHaveBeenCalled()
    })

    it('second claim on last slot fails with eligibility error (concurrent scenario)', async () => {
      // Simulate: after first claim, currentUsageCount equals usageLimit
      const exhaustedPromo = { ...PROMO, currentUsageCount: 1, usageLimit: 1 }
      txMock.promotion.findUnique.mockResolvedValueOnce(exhaustedPromo)
      eligibility.validate.mockResolvedValueOnce({
        valid: false,
        error: 'Mã đã hết lượt dùng',
      })

      await expect(
        service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID),
      ).rejects.toThrow(BadRequestException)
    })

    it('acquires row-level lock via FOR UPDATE before checking eligibility', async () => {
      await service.validateAndClaim('SAVE10', CART, USER_ID, ORDER_ID)
      expect(txMock.$executeRaw).toHaveBeenCalled()
      // Lock must be acquired before findUnique
      const executeRawOrder = txMock.$executeRaw.mock.invocationCallOrder[0]
      const findUniqueOrder = txMock.promotion.findUnique.mock.invocationCallOrder[0]
      expect(executeRawOrder).toBeLessThan(findUniqueOrder)
    })
  })

  describe('findByCode', () => {
    it('returns promotion when found', async () => {
      const result = await service.findByCode('SAVE10')
      expect(result).toMatchObject({ code: 'SAVE10' })
    })

    it('throws NotFoundException when code does not exist', async () => {
      prismaMock.promotion.findUnique.mockResolvedValueOnce(null)
      await expect(service.findByCode('UNKNOWN')).rejects.toThrow(NotFoundException)
    })
  })

  describe('preview', () => {
    it('validates an order context without claiming usage', async () => {
      const result = await service.preview('SAVE10', CART, USER_ID)

      expect(result).toEqual({ discountAmount: 10_000 })
      expect(eligibility.validate).toHaveBeenCalledWith(PROMO, CART, USER_ID)
      expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it('throws NotFoundException when preview code does not exist', async () => {
      prismaMock.promotion.findUnique.mockResolvedValueOnce(null)

      await expect(service.preview('UNKNOWN', CART, USER_ID)).rejects.toThrow(NotFoundException)
    })
  })

  describe('customer promotion lists', () => {
    it('returns only promotions the authenticated customer can still use', async () => {
      prismaMock.promotion.findMany.mockResolvedValue([
        PROMO,
        { ...PROMO, id: 'exhausted', currentUsageCount: 1, usageLimit: 1 },
        { ...PROMO, id: 'first-order', firstOrderOnly: true },
        { ...PROMO, id: 'per-user', maxPerUser: 1 },
      ])
      prismaMock.promotionUsage.groupBy.mockResolvedValue([
        { promotionId: 'per-user', _count: { _all: 1 } },
      ])
      prismaMock.order.count.mockResolvedValue(2)

      const result = await service.listAvailable(USER_ID)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(expect.objectContaining({
        id: PROMO.id,
        code: 'SAVE10',
        title: 'Save ten percent',
        percentOff: 10,
        status: 'available',
      }))
      expect(prismaMock.promotionUsage.groupBy).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: USER_ID },
      }))
    })

    it('returns a deduplicated history of promotions used by the customer', async () => {
      const usedAt = new Date('2026-07-04T00:00:00.000Z')
      prismaMock.promotionUsage.findMany.mockResolvedValue([
        { promotionId: PROMO.id, promotion: PROMO, usedAt },
        { promotionId: PROMO.id, promotion: PROMO, usedAt: new Date('2026-07-03T00:00:00.000Z') },
      ])

      const result = await service.listMine(USER_ID)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(expect.objectContaining({
        id: PROMO.id,
        isUsed: true,
        status: 'used',
        usedAt: usedAt.toISOString(),
      }))
      expect(prismaMock.promotionUsage.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: USER_ID },
      }))
    })
  })
})
