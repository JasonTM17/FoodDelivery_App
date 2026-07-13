import { Prisma } from '@prisma/client'
import type { KnowledgeEntry } from './rag-document.types'

export const ragMenuItemSelect = {
  id: true,
  name: true,
  description: true,
  basePrice: true,
  isPopular: true,
  category: { select: { name: true } },
  restaurant: { select: { name: true, cuisineTypes: true, city: true } },
} satisfies Prisma.MenuItemSelect

export const ragRestaurantSelect = {
  id: true,
  name: true,
  description: true,
  cuisineTypes: true,
  priceRange: true,
  rating: true,
  city: true,
  prepTimeAvgMinutes: true,
  addressLine: true,
} satisfies Prisma.RestaurantSelect

type RagMenuItemSource = Prisma.MenuItemGetPayload<{ select: typeof ragMenuItemSelect }>
type RagRestaurantSource = Prisma.RestaurantGetPayload<{ select: typeof ragRestaurantSelect }>

export function mapMenuItemToKnowledgeEntry(item: RagMenuItemSource): KnowledgeEntry {
  return {
    docType: 'menu',
    locale: 'vi',
    title: `Món ${item.name} — ${item.restaurant.name}`,
    content: [
      `Tên món: ${item.name}`,
      item.description ? `Mô tả: ${item.description}` : null,
      `Giá: ${Number(item.basePrice).toLocaleString('vi-VN')}đ`,
      `Danh mục: ${item.category.name}`,
      `Nhà hàng: ${item.restaurant.name}`,
      item.restaurant.cuisineTypes.length
        ? `Ẩm thực: ${item.restaurant.cuisineTypes.join(', ')}`
        : null,
      `Khu vực: ${item.restaurant.city}`,
      item.isPopular ? 'Đây là món phổ biến được nhiều khách đặt.' : null,
    ].filter(Boolean).join('\n'),
    sourceId: item.id,
  }
}

export function mapRestaurantToKnowledgeEntry(restaurant: RagRestaurantSource): KnowledgeEntry {
  return {
    docType: 'restaurant',
    locale: 'vi',
    title: `Nhà hàng ${restaurant.name}`,
    content: [
      `Tên: ${restaurant.name}`,
      restaurant.description ? `Giới thiệu: ${restaurant.description}` : null,
      restaurant.cuisineTypes.length ? `Ẩm thực: ${restaurant.cuisineTypes.join(', ')}` : null,
      `Phân khúc giá: ${restaurant.priceRange}`,
      `Đánh giá: ${Number(restaurant.rating).toFixed(1)}/5`,
      `Thời gian chuẩn bị trung bình: ${restaurant.prepTimeAvgMinutes} phút`,
      `Địa chỉ: ${restaurant.addressLine}, ${restaurant.city}`,
    ].filter(Boolean).join('\n'),
    sourceId: restaurant.id,
  }
}
