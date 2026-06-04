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

  async createCategory(userId: string, dto: CreateCategoryDto) {
    const restaurantId = await this.getOwnedRestaurantId(userId)
    return this.prisma.category.create({
      data: {
        restaurantId,
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
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

    return this.prisma.menuItem.update({
      where: { id: itemId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
        ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
        ...(dto.isPopular !== undefined && { isPopular: dto.isPopular }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      },
      include: {
        options: {
          include: { values: true },
        },
      },
    })
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
