import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { NotificationsService } from '../notifications/notifications.service'
import { ReviewsService } from './reviews.service'
import { ModerationService } from './moderation.service'
import { AggregationService } from './aggregation.service'
import { ReviewsPhotoService } from './reviews-photo.service'
import { PrismaService } from '../database/prisma.service'

const ORDER_ID = 'order-uuid'
const USER_ID = 'user-uuid'
const RESTAURANT_ID = 'restaurant-uuid'
const DRIVER_ID = 'driver-uuid'
const REVIEW_ID = 'review-uuid'

const deliveredOrder = {
  id: ORDER_ID,
  customerId: USER_ID,
  restaurantId: RESTAURANT_ID,
  driverId: DRIVER_ID,
  status: 'delivered',
  updatedAt: new Date(),
  deliveryTask: { deliveredAt: new Date() },
}

describe('ReviewsService', () => {
  let service: ReviewsService
  let mockPrisma: {
    order: { findUnique: jest.Mock }
    review: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; count: jest.Mock; findMany: jest.Mock; groupBy: jest.Mock }
    restaurantProfile: { findUnique: jest.Mock; findMany: jest.Mock }
    $transaction: jest.Mock
  }
  let mockTx: { review: { create: jest.Mock } }
  let mockNotifications: { fanout: jest.Mock }
  let mockModeration: { checkProfanity: jest.Mock; adminHide: jest.Mock }
  let mockAggregation: { recalcRestaurantRating: jest.Mock; recalcDriverRating: jest.Mock }
  let mockPhoto: { getUploadUrl: jest.Mock; validatePhotoCount: jest.Mock }

  beforeEach(() => {
    mockTx = {
      review: { create: jest.fn().mockResolvedValue({ id: REVIEW_ID, orderId: ORDER_ID }) },
    }
    mockPrisma = {
      order: { findUnique: jest.fn().mockResolvedValue(deliveredOrder) },
      review: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: REVIEW_ID }),
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn().mockResolvedValue([]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      restaurantProfile: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest
        .fn()
        .mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    }
    mockNotifications = { fanout: jest.fn().mockResolvedValue({ sent: true }) }
    mockModeration = {
      checkProfanity: jest.fn().mockReturnValue({ clean: true, flagged_words: [] }),
      adminHide: jest.fn().mockResolvedValue(undefined),
    }
    mockAggregation = {
      recalcRestaurantRating: jest.fn().mockResolvedValue(undefined),
      recalcDriverRating: jest.fn().mockResolvedValue(undefined),
    }
    mockPhoto = {
      getUploadUrl: jest.fn().mockResolvedValue({ url: 'https://minio/presigned', key: 'k' }),
      validatePhotoCount: jest.fn(),
    }

    service = new ReviewsService(
      mockPrisma as unknown as PrismaService,
      mockNotifications as unknown as NotificationsService,
      mockModeration as unknown as ModerationService,
      mockAggregation as unknown as AggregationService,
      mockPhoto as unknown as ReviewsPhotoService,
    )
  })

  describe('createReview()', () => {
    const dto = { foodRating: 4, deliveryRating: 5, comment: 'Great food', photos: [] }

    it('throws NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null)
      await expect(service.createReview(ORDER_ID, USER_ID, dto)).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when order belongs to another user', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...deliveredOrder, customerId: 'other' })
      await expect(service.createReview(ORDER_ID, USER_ID, dto)).rejects.toThrow(ForbiddenException)
    })

    it('throws BadRequestException when order is not delivered', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'paid' })
      await expect(service.createReview(ORDER_ID, USER_ID, dto)).rejects.toThrow(BadRequestException)
    })

    it('throws BadRequestException when review window expired', async () => {
      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      mockPrisma.order.findUnique.mockResolvedValue({
        ...deliveredOrder,
        deliveryTask: { deliveredAt: oldDate },
      })
      await expect(service.createReview(ORDER_ID, USER_ID, dto)).rejects.toThrow(BadRequestException)
    })

    it('throws ConflictException when review already exists', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({ id: REVIEW_ID })
      await expect(service.createReview(ORDER_ID, USER_ID, dto)).rejects.toThrow(ConflictException)
    })

    it('throws BadRequestException when comment contains profanity', async () => {
      mockModeration.checkProfanity.mockReturnValue({ clean: false, flagged_words: ['đụ'] })
      await expect(
        service.createReview(ORDER_ID, USER_ID, { ...dto, comment: 'bad text' }),
      ).rejects.toThrow(BadRequestException)
    })

    it('creates review and recalculates ratings', async () => {
      await service.createReview(ORDER_ID, USER_ID, dto)
      expect(mockTx.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ foodRating: 4, deliveryRating: 5 }),
        }),
      )
      expect(mockAggregation.recalcRestaurantRating).toHaveBeenCalledWith(RESTAURANT_ID, mockTx)
      expect(mockAggregation.recalcDriverRating).toHaveBeenCalledWith(DRIVER_ID, mockTx)
    })

    it('skips driver recalculation when no deliveryRating provided', async () => {
      await service.createReview(ORDER_ID, USER_ID, { foodRating: 3, photos: [] })
      expect(mockAggregation.recalcDriverRating).not.toHaveBeenCalled()
    })
  })

  describe('restaurantReply()', () => {
    const dto = { reply: 'Thank you for your feedback!' }

    it('throws NotFoundException when review does not exist', async () => {
      mockPrisma.review.findUnique.mockResolvedValue(null)
      await expect(service.restaurantReply(REVIEW_ID, USER_ID, dto)).rejects.toThrow(NotFoundException)
    })

    it('throws ForbiddenException when restaurant does not own review', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: REVIEW_ID,
        restaurantId: RESTAURANT_ID,
        replyAt: null,
      })
      mockPrisma.restaurantProfile.findUnique.mockResolvedValue({
        userId: USER_ID,
        restaurantId: 'other-restaurant',
      })
      await expect(service.restaurantReply(REVIEW_ID, USER_ID, dto)).rejects.toThrow(ForbiddenException)
    })

    it('throws BadRequestException when edit window closed', async () => {
      const oldReplyAt = new Date(Date.now() - 25 * 60 * 60 * 1000)
      mockPrisma.review.findUnique.mockResolvedValue({
        id: REVIEW_ID,
        restaurantId: RESTAURANT_ID,
        replyAt: oldReplyAt,
      })
      mockPrisma.restaurantProfile.findUnique.mockResolvedValue({
        userId: USER_ID,
        restaurantId: RESTAURANT_ID,
      })
      await expect(service.restaurantReply(REVIEW_ID, USER_ID, dto)).rejects.toThrow(BadRequestException)
    })

    it('creates reply on first attempt', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: REVIEW_ID,
        restaurantId: RESTAURANT_ID,
        replyAt: null,
      })
      mockPrisma.restaurantProfile.findUnique.mockResolvedValue({
        userId: USER_ID,
        restaurantId: RESTAURANT_ID,
      })
      await service.restaurantReply(REVIEW_ID, USER_ID, dto)
      expect(mockPrisma.review.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ reply: dto.reply }) }),
      )
    })

    it('allows edit within 24h window', async () => {
      const recentReplyAt = new Date(Date.now() - 2 * 60 * 60 * 1000)
      mockPrisma.review.findUnique.mockResolvedValue({
        id: REVIEW_ID,
        restaurantId: RESTAURANT_ID,
        replyAt: recentReplyAt,
      })
      mockPrisma.restaurantProfile.findUnique.mockResolvedValue({
        userId: USER_ID,
        restaurantId: RESTAURANT_ID,
      })
      await expect(service.restaurantReply(REVIEW_ID, USER_ID, dto)).resolves.toBeDefined()
    })
  })

  describe('getRestaurantReviews()', () => {
    it('returns the complete restaurant dashboard contract for the authenticated tenant', async () => {
      const createdAt = new Date('2026-07-02T08:00:00.000Z')
      mockPrisma.restaurantProfile.findUnique.mockResolvedValue({
        userId: USER_ID,
        restaurantId: RESTAURANT_ID,
      })
      mockPrisma.review.findMany.mockResolvedValue([
        {
          id: REVIEW_ID,
          orderId: ORDER_ID,
          foodRating: 5,
          comment: 'Great food',
          photos: [],
          reply: null,
          replyAt: null,
          createdAt,
          customer: { fullName: 'Ánh Nguyễn', avatarUrl: null },
          order: { orderItems: [{ menuItemId: 'menu-item-uuid', nameSnapshot: 'Phở bò' }] },
        },
      ])
      mockPrisma.review.count.mockResolvedValue(1)
      mockPrisma.review.groupBy.mockResolvedValue([{ foodRating: 5, _count: 1 }])

      const result = await service.getRestaurantReviews(USER_ID, 1, 20)

      expect(result.reviews).toEqual([
        expect.objectContaining({
          id: REVIEW_ID,
          orderId: ORDER_ID,
          customerName: 'Ánh Nguyễn',
          customerInitial: 'Á',
          rating: 5,
          dishId: 'menu-item-uuid',
          createdAt,
        }),
      ])
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 1, hasMore: false })
      expect(result.distribution).toEqual({ 5: 1 })
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ restaurantId: RESTAURANT_ID }) }),
      )
    })
  })

  describe('adminHide()', () => {
    it('delegates to moderation service', async () => {
      await service.adminHide(REVIEW_ID, USER_ID, 'spam content')
      expect(mockModeration.adminHide).toHaveBeenCalledWith(REVIEW_ID, USER_ID, 'spam content')
    })
  })
})

describe('ModerationService', () => {
  let moderation: ModerationService
  let mockTx: {
    review: { update: jest.Mock }
    orderStatusHistory: { create: jest.Mock }
  }
  let mockPrisma: {
    review: { findUniqueOrThrow: jest.Mock }
    $transaction: jest.Mock
  }

  beforeEach(() => {
    mockTx = {
      review: { update: jest.fn().mockResolvedValue({}) },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    }
    mockPrisma = {
      review: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'r1', orderId: 'o1' }),
      },
      $transaction: jest
        .fn()
        .mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    }
    moderation = new ModerationService(mockPrisma as unknown as PrismaService)
  })

  describe('checkProfanity()', () => {
    it('returns clean for normal text', () => {
      expect(moderation.checkProfanity('Đồ ăn rất ngon')).toEqual({
        clean: true,
        flagged_words: [],
      })
    })

    it('flags Vietnamese profanity', () => {
      const result = moderation.checkProfanity('đồ ăn đụ quá')
      expect(result.clean).toBe(false)
      expect(result.flagged_words).toContain('đụ')
    })

    it('is case-insensitive', () => {
      const result = moderation.checkProfanity('ĐỤ')
      expect(result.clean).toBe(false)
    })

    it('detects multiple violations', () => {
      const result = moderation.checkProfanity('lồn cặc')
      expect(result.flagged_words.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('adminHide()', () => {
    it('hides review and writes audit entry in transaction', async () => {
      await moderation.adminHide('r1', 'admin-uuid', 'spam')
      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(mockTx.review.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isHidden: true, hiddenReason: 'spam' }),
        }),
      )
      expect(mockTx.orderStatusHistory.create).toHaveBeenCalled()
    })
  })
})
