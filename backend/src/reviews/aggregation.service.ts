import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'

@Injectable()
export class AggregationService {
  // Running-average via direct DB aggregate to avoid drift on concurrent reviews.
  // Restaurant uses `totalReviews` as the published count alongside cached avg.
  async recalcRestaurantRating(
    restaurantId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const agg = await tx.review.aggregate({
      where: { restaurantId, isHidden: false },
      _avg: { foodRating: true },
      _count: { id: true },
    })

    const newAvg =
      agg._avg.foodRating != null ? Number(agg._avg.foodRating.toFixed(1)) : 5.0
    const newCount = agg._count.id

    await tx.restaurant.update({
      where: { id: restaurantId },
      data: { rating: newAvg, totalReviews: newCount },
    })
  }

  // Driver rating derived from deliveryRating across all their reviews.
  async recalcDriverRating(
    driverId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const agg = await tx.review.aggregate({
      where: { driverId, deliveryRating: { not: null }, isHidden: false },
      _avg: { deliveryRating: true },
    })

    if (agg._avg.deliveryRating == null) return

    const newAvg = Number(agg._avg.deliveryRating.toFixed(1))

    await tx.driverProfile.update({
      where: { userId: driverId },
      data: { rating: newAvg },
    })
  }
}
