import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import {
  CreateCategoryDto, UpdateCategoryDto,
  CreateMenuItemDto, UpdateMenuItemDto,
} from './menu.dto'

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
    return this.prisma.category.findMany({
      where: { restaurantId },
      include: { _count: { select: { menuItems: true } } },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    })
  }

  async getItems(userId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    return this.prisma.menuItem.findMany({
      where: { restaurantId },
      include: { category: true, options: { include: { values: true } } },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    })
  }

  async getItem(userId: string, itemId: string) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const item = await this.prisma.menuItem.findFirst({
      where: { id: itemId, restaurantId },
      include: { category: true, options: { include: { values: true } } },
    })
    if (!item) throw new NotFoundException('Menu item not found')
    return item
  }

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    return this.prisma.category.create({
      data: {
        restaurantId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        parentId: dto.parentId,
        icon: dto.icon,
        isVisible: dto.isVisible ?? true,
      },
    })
  }

  async updateCategory(userId: string, categoryId: string, dto: UpdateCategoryDto) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    })
    if (!category || category.restaurantId !== restaurantId) {
      throw new NotFoundException('Category not found')
    }
    return this.prisma.category.update({
      where: { id: categoryId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.icon !== undefined && { icon: dto.icon }),
        ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
      },
    })
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

    // Verify category belongs to this restaurant
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    })
    if (!category || category.restaurantId !== restaurantId) {
      throw new BadRequestException('Category not found or does not belong to your restaurant')
    }

    return this.prisma.menuItem.create({
      data: {
        restaurantId,
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        basePrice: dto.basePrice,
        isAvailable: dto.isAvailable ?? true,
        isPopular: dto.isPopular ?? false,
        ...(dto.options?.length
          ? {
              options: {
                create: dto.options.map((opt) => ({
                  name: opt.name,
                  isRequired: opt.isRequired ?? false,
                  isMultiple: opt.isMultiple ?? false,
                  values: {
                    create: opt.values.map((v) => ({
                      value: v.value,
                      priceModifier: v.priceModifier ?? 0,
                    })),
                  },
                })),
              },
            }
          : {}),
      },
      include: {
        options: {
          include: { values: true },
        },
      },
    })
  }

  async updateMenuItem(userId: string, itemId: string, dto: UpdateMenuItemDto) {
    const restaurantId = await this.getOwnedRestaurantId(userId)

    const item = await this.prisma.menuItem.findUnique({
      where: { id: itemId },
    })
    if (!item || item.restaurantId !== restaurantId) {
      throw new NotFoundException('Menu item not found')
    }

    // If categoryId is being updated, verify it belongs to restaurant
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      })
      if (!category || category.restaurantId !== restaurantId) {
        throw new BadRequestException('Category not found or does not belong to your restaurant')
      }
    }

    return this.prisma.$transaction(async tx => {
      if (dto.options !== undefined) {
        await tx.menuItemOptionValue.deleteMany({ where: { option: { menuItemId: itemId } } })
        await tx.menuItemOption.deleteMany({ where: { menuItemId: itemId } })
      }
      return tx.menuItem.update({
        where: { id: itemId },
        data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        ...(dto.isPopular !== undefined && { isPopular: dto.isPopular }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.options !== undefined && {
          options: {
            create: dto.options.map(option => ({
              name: option.name,
              isRequired: option.isRequired ?? false,
              isMultiple: option.isMultiple ?? false,
              values: { create: option.values.map(value => ({
                value: value.value,
                priceModifier: value.priceModifier ?? 0,
              })) },
            })),
          },
        }),
        },
        include: {
          options: { include: { values: true } },
        },
      })
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
    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable: !item.isAvailable },
    })
  }
}
