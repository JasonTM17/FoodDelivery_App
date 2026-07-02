import { z } from 'zod'

export const createPromotionSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(['percentage', 'fixed', 'free_delivery', 'bogo', 'combo']),
  value: z.number().int().min(0),
  minOrderAmount: z.number().int().min(0).optional(),
  maxDiscount: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1),
  maxPerUser: z.number().int().min(1).optional(),
  targeting: z.record(z.unknown()).optional(),
  startsAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  isActive: z.boolean().optional(),
})

export type CreatePromotionInput = z.infer<typeof createPromotionSchema>

export const updatePromotionSchema = z.object({
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(['percentage', 'fixed', 'free_delivery', 'bogo', 'combo']).optional(),
  value: z.number().int().min(0).optional(),
  minOrderAmount: z.number().int().min(0).optional(),
  maxDiscount: z.number().int().min(0).optional(),
  usageLimit: z.number().int().min(1).optional(),
  maxPerUser: z.number().int().min(1).optional(),
  targeting: z.record(z.unknown()).optional(),
  startsAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
    .optional(),
  expiresAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
    .optional(),
  isActive: z.boolean().optional(),
})

export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>

export const toggleUserStatusSchema = z.object({
  isActive: z.boolean(),
})

export const toggleRestaurantStatusSchema = z.object({
  isActive: z.boolean(),
})

export const updateSupportTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  assignedAdminId: z.string().optional(),
  resolutionNotes: z.string().optional(),
})
