import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { ModerationService } from './moderation.service'
import { AggregationService } from './aggregation.service'
import { ReviewsPhotoService } from './reviews-photo.service'
import { CreateReviewInput, RestaurantReplyInput } from './reviews.zod'
const REVIEW_WINDOW_DAYS = 7
const REPLY_EDIT_WINDOW_HOURS = 24
const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_HOUR = 60 * 60 * 1000

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly moderation: ModerationService,
    private readonly aggregation: AggregationService,
    private readonly photo: ReviewsPhotoService,
  ) {}

  async createReview(orderId: string, userId: string, dto: CreateReviewInput) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryTask: { select: { deliveredAt: true } } },
    })

    if (!order) throw new NotFoundException('Order not found')
    if (order.customerId !== userId) throw new ForbiddenException('Not your order')
    if (order.status !== 'delivered') {
      throw new BadRequestException('Order must be delivered before reviewing')
    }

    // Use deliveryTask.deliveredAt; fall back to order.updatedAt if task missing
    const deliveredAt = order.deliveryTask?.deliveredAt ?? order.updatedAt
    if ((Date.now() - new Date(deliveredAt).getTime()) / MS_PER_DAY >= REVIEW_WINDOW_DAYS) {
      throw new BadRequestException('Review window has expired (7 days after delivery)')
    }

    const existing = await this.prisma.review.findUnique({ where: { orderId } })
    if (existing) throw new ConflictException('Review already submitted for this order')

    if (dto.comment) {
      const { clean, flagged_words } = this.moderation.checkProfanity(dto.comment)
      if (!clean) {
        throw new BadRequestException(
          `Comment contains inappropriate language: ${flagged_words.join(', ')}`,
        )
      }
    }

    if (dto.photos?.length) this.photo.validatePhotoCount(dto.photos)

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId,
          customerId: userId,
          restaurantId: order.restaurantId,
          driverId: order.driverId ?? null,
          foodRating: dto.foodRating,
          deliveryRating: dto.deliveryRating ?? null,
          comment: dto.comment ?? null,
          photos: dto.photos ?? [],
        },
      })

      await this.aggregation.recalcRestaurantRating(order.restaurantId, tx)

      if (dto.deliveryRating != null && order.driverId) {
        await this.aggregation.recalcDriverRating(order.driverId, tx)
      }

      return created
    })

    this.notifyOnReview(order.restaurantId, order.driverId, review.id).catch(
      (err: Error) => this.logger.warn(`Review notification failed: ${err.message}`),
    )

    return review
  }

  async restaurantReply(reviewId: string, userId: string, dto: RestaurantReplyInput) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } })
    if (!review) throw new NotFoundException('Review not found')

    const profile = await this.prisma.restaurantProfile.findUnique({ where: { userId } })
    if (!profile || profile.restaurantId !== review.restaurantId) {
      throw new ForbiddenException('Not authorized to reply to this review')
    }

    // Allow edit only within 24h of first reply
    if (review.replyAt) {
      const hoursSince = (Date.now() - new Date(review.replyAt).getTime()) / MS_PER_HOUR
      if (hoursSince > REPLY_EDIT_WINDOW_HOURS) {
        throw new BadRequestException('Reply edit window has closed (24 hours after first reply)')
      }
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        reply: dto.reply,
        // Preserve original replyAt timestamp so the edit window is anchored to first reply
        replyAt: review.replyAt ?? new Date(),
      },
    })
  }

  async adminHide(reviewId: string, adminUserId: string, reason: string): Promise<void> {
    return this.moderation.adminHide(reviewId, adminUserId, reason)
  }

  async getPhotoUploadUrl(contentType: string) {
    return this.photo.getUploadUrl(contentType)
  }

  async getReviewsByRestaurant(restaurantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { restaurantId, isHidden: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: { restaurantId, isHidden: false } }),
    ])
    return { items, total, page, limit }
  }

  private async notifyOnReview(
    restaurantId: string,
    driverId: string | null,
    reviewId: string,
  ): Promise<void> {
    const ownerProfiles = await this.prisma.restaurantProfile.findMany({
      where: { restaurantId },
      select: { userId: true },
    })

    await Promise.allSettled([
      ...ownerProfiles.map(p =>
        this.notifications.fanout(p.userId, 'review.new', { sourceId: reviewId }),
      ),
      ...(driverId
        ? [this.notifications.fanout(driverId, 'review.new', { sourceId: reviewId })]
        : []),
    ])
  }
}
