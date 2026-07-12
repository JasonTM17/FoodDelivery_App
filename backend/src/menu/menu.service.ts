import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import {
  CreateCategoryDto, UpdateCategoryDto,
  CreateOptionDto,
  CreateMenuItemDto, UpdateMenuItemDto,
} from './menu.dto'
import { buildMenuCategoryTree, toMenuCategoryNode } from './menu-category-tree'

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  private async getOwnedRestaurantId(userId: string): Promise<string> {
    const profile = await this.prisma.restaurantProfile.findUnique({
      where: { userId },
    })
    if (!profile) {
      throw new ForbiddenException('User does not own a restaurant')
    }
    return profile.restaurantId
  }

  async getMenu(userId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        openingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              orderBy: { createdAt: 'asc' },
              include: {
                options: {
                  include: { values: true },
                },
              },
            },
          },
        },
      },
    })
    if (!restaurant) throw new NotFoundException('Restaurant not found')
    return restaurant
  }

  async getCategories(userId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const categories = await this.prisma.category.findMany({
      where: { restaurantId },
      include: { _count: { select: { menuItems: true } } },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    })
    return buildMenuCategoryTree(categories)
  }

  async getItems(userId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const items = await this.prisma.menuItem.findMany({
      where: { restaurantId },
      include: { category: true, options: { include: { values: true } } },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    })
    return items.map(item => this.serializeMenuItem(item))
  }

  async getItem(userId: string, itemId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
      include: { category: true, options: { include: { values: true } } },
    })
    if (!item) throw new NotFoundException('Menu item not found')
    return this.serializeMenuItem(item)
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    if (dto.parentId) {
      await this.assertParentCategoryOwned(restaurantId, dto.parentId)
    }
    const category = await this.prisma.category.create({
      data: {
        restaurantId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        parentId: dto.parentId,
        icon: dto.icon,
        isVisible: dto.isVisible ?? true,
      },
    })
    return toMenuCategoryNode(category)
  }

  async updateCategory(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    })
    if (!category || category.restaurantId !== restaurantId) {
      throw new NotFoundException('Category not found')
    }
    if (dto.parentId !== undefined && dto.parentId !== null) {
      await this.assertParentCategoryOwned(restaurantId, dto.parentId)
    }
    const updated = await this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
      },
      include: { _count: { select: { menuItems: true } } },
    })
    return toMenuCategoryNode(updated, updated._count.menuItems)
  }

  private async assertParentCategoryOwned(restaurantId: string, parentId: string): Promise<void> {
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } })
    if (!parent || parent.restaurantId !== restaurantId) {
      throw new NotFoundException('Parent category not found')
    }
  }

  async deleteCategory(userId: string, categoryId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    })
    if (!category || category.restaurantId !== restaurantId) {
      throw new NotFoundException('Category not found')
    }
    await this.prisma.category.delete({ where: { id: categoryId } })
  }

  async createMenuItem(userId: string, dto: CreateMenuItemDto) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const categoryId = await this.resolveCategoryId(restaurantId, dto.categoryId, dto.category)
    const basePrice = dto.basePrice ?? dto.price
    if (basePrice === undefined) throw new BadRequestException('BASE_PRICE_REQUIRED')

    const item = await this.prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl ?? dto.image,
        basePrice,
        isAvailable: dto.isAvailable ?? dto.available ?? true,
        isPopular: dto.isPopular ?? false,
        ...(dto.options?.length
          ? {
              options: {
                create: this.toOptionCreates(dto.options),
              },
            }
          : {}),
      },
      include: {
        category: true,
        options: {
          include: { values: true },
        },
      },
    })
    return this.serializeMenuItem(item)
  }

  async updateMenuItem(userId: string, itemId: string, dto: UpdateMenuItemDto) {
    const restaurantId = await this.getOwnedRestaurantId(userId)

    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
    })
    if (!item || item.restaurantId !== restaurantId) {
      throw new NotFoundException('Menu item not found')
    }

    const nextCategoryId = dto.categoryId || dto.category
      ? await this.resolveCategoryId(restaurantId, dto.categoryId, dto.category)
      : undefined

    return this.prisma.$transaction(async tx => {
      if (dto.options !== undefined) {
        await tx.menuItemOptionValue.deleteMany({ where: { option: { menuItemId: itemId } } })
        await tx.menuItemOption.deleteMany({ where: { menuItemId: itemId } })
      }
      const updated = await tx.menuItem.update({
        where: { id: itemId },
        data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...((dto.imageUrl !== undefined || dto.image !== undefined) && { imageUrl: dto.imageUrl ?? dto.image }),
        ...((dto.basePrice !== undefined || dto.price !== undefined) && { basePrice: dto.basePrice ?? dto.price }),
        ...((dto.isAvailable !== undefined || dto.available !== undefined) && { isAvailable: dto.isAvailable ?? dto.available }),
        ...(dto.isPopular !== undefined && { isPopular: dto.isPopular }),
        ...(nextCategoryId !== undefined && { categoryId: nextCategoryId }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.options !== undefined && {
          options: {
            create: this.toOptionCreates(dto.options),
          },
        }),
        },
        include: {
          category: true,
          options: { include: { values: true } },
        },
      })
      return this.serializeMenuItem(updated)
    })
  }

  async reorderCategories(userId: string, items: Array<{ id: string; sortOrder: number }>) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const owned = await this.prisma.category.count({ where: { restaurantId, id: { in: items.map(item => item.id) } } })
    if (owned !== items.length) throw new BadRequestException('CATEGORY_OWNERSHIP_MISMATCH')
    await this.prisma.$transaction(items.map(item =>
      this.prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })))
    return { updated: items.length }
  }

  async reorderItems(userId: string, items: Array<{ id: string; sortOrder: number }>) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const owned = await this.prisma.menuItem.count({ where: { restaurantId, id: { in: items.map(item => item.id) } } })
    if (owned !== items.length) throw new BadRequestException('MENU_ITEM_OWNERSHIP_MISMATCH')
    await this.prisma.$transaction(items.map(item =>
      this.prisma.menuItem.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })))
    return { updated: items.length }
  }

  async deleteMenuItem(userId: string, itemId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
    })
    if (!item || item.restaurantId !== restaurantId) {
      throw new NotFoundException('Menu item not found')
    }
    await this.prisma.menuItem.delete({ where: { id: itemId } })
  }

  async toggleMenuItem(userId: string, itemId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
    })
    if (!item || item.restaurantId !== restaurantId) {
      throw new NotFoundException('Menu item not found')
    }
    const updated = await this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !item.isAvailable },
      include: { category: true, options: { include: { values: true } } },
    })
    return this.serializeMenuItem(updated)
  }

  private async resolveCategoryId(restaurantId: string, categoryId?: string, categoryName?: string) {
    if (categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: categoryId } })
      if (!category || category.restaurantId !== restaurantId) {
        throw new BadRequestException('Category not found or does not belong to your restaurant')
      }
      return category.id
    }

    const name = categoryName?.trim()
    if (!name) throw new BadRequestException('CATEGORY_REQUIRED')
    const existing = await this.prisma.category.findFirst({ where: { restaurantId, name } })
    if (existing) return existing.id
    const created = await this.prisma.category.create({ data: { restaurantId, name, sortOrder: 0, isVisible: true } })
    return created.id
  }

  private toOptionCreates(options: CreateOptionDto[]) {
    return options.map(option => {
      const values = option.values?.length
        ? option.values
        : (option.choices ?? []).map(choice => ({ value: choice.name, priceModifier: choice.price ?? 0 }))
      return {
        name: option.name,
        isRequired: option.isRequired ?? option.required ?? false,
        isMultiple: option.isMultiple ?? option.type === 'multi',
        values: {
          create: values.map(value => ({
            value: value.value,
            priceModifier: value.priceModifier ?? 0,
          })),
        },
      }
    })
  }

  private serializeMenuItem(item: {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    basePrice: unknown
    isAvailable: boolean
    restaurantId: string
    createdAt: Date
    updatedAt: Date
    category: { id: string; name: string }
    options: Array<{
      id: string
      name: string
      isRequired: boolean
      isMultiple: boolean
      values: Array<{ id: string; value: string; priceModifier: unknown }>
    }>
  }) {
    return {
      id: item.id,
      name: item.name,
      description: item.description ?? '',
      price: Number(item.basePrice),
      category: item.category.name,
      categoryId: item.category.id,
      image: item.imageUrl ?? '',
      available: item.isAvailable,
      restaurantId: item.restaurantId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      options: item.options.map(option => ({
        id: option.id,
        name: option.name,
        type: option.isMultiple ? 'multi' : 'single',
        required: option.isRequired,
        choices: option.values.map(value => ({
          id: value.id,
          name: value.value,
          price: Number(value.priceModifier),
        })),
      })),
    }
  }
}
