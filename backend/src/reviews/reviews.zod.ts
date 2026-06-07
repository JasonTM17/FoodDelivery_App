import { z } from 'zod'

export const createReviewSchema = z.object({
  foodRating: z.number().int().min(1).max(5),
  deliveryRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).max(4).default([]),
})

export const restaurantReplySchema = z.object({
  reply: z.string().min(1).max(500),
})

export const adminHideSchema = z.object({
  reason: z.string().min(1).max(500),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type RestaurantReplyInput = z.infer<typeof restaurantReplySchema>
export type AdminHideInput = z.infer<typeof adminHideSchema>
