import { z } from 'zod'

const optionValueSchema = z.object({
  value: z.string().min(1).max(100),
  priceModifier: z.number().min(0).optional(),
})

const createOptionSchema = z.object({
  name: z.string().min(1).max(100),
  isRequired: z.boolean().optional(),
  isMultiple: z.boolean().optional(),
  type: z.enum(['single', 'multi']).optional(),
  required: z.boolean().optional(),
  values: z.array(optionValueSchema).optional(),
  choices: z.array(z.object({
    name: z.string().min(1).max(100),
    price: z.number().min(0).optional(),
  })).optional(),
})

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional(),
  parentId: z.string().uuid().optional(),
  icon: z.string().max(50).optional(),
  isVisible: z.boolean().optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  parentId: z.string().uuid().nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  isVisible: z.boolean().optional(),
})

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

export const createMenuItemSchema = z.object({
  categoryId: z.string().min(1).optional(),
  category: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  image: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  available: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  options: z.array(createOptionSchema).optional(),
})

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>

export const updateMenuItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  image: z.string().optional(),
  basePrice: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
  available: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  categoryId: z.string().optional(),
  category: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  options: z.array(createOptionSchema).optional(),
})

export const reorderMenuEntitySchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int().min(0) })).min(1),
})

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>
