import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'
import { Prisma } from '@prisma/client'
import { NearbyQueryDto, SearchQueryDto } from './restaurants.dto'

export interface NearbyRestaurantRow {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address_line: string
  district: string | null
  dist_km: number
  rating: number
  total_reviews: number
  price_range: string
  cuisine_types: string[]
  prep_time_avg_minutes: number
  is_open: boolean
}

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findNearby(dto: NearbyQueryDto) {
    const { lat, lng, radius, cuisine, page, limit } = dto
    const radiusMeters = radius * 1000
    const offset = (page - 1) * limit

    const point = () => Prisma.sql`
      ST_SetSRID(
        ST_MakePoint(CAST(${lng} AS double precision), CAST(${lat} AS double precision)),
        4326
      )::geography
    `
    const cuisineFilter = cuisine
      ? Prisma.sql`AND r.cuisine_types @> ARRAY[CAST(${cuisine} AS text)]`
      : Prisma.empty

    const items = await this.prisma.$queryRaw<NearbyRestaurantRow[]>(Prisma.sql`
      SELECT r.id, r.name, r.slug, r.logo_url, r.address_line, r.district,
             (ST_Distance(r.location, ${point()}) / 1000)::float AS dist_km,
             r.rating::float AS rating,
             r.total_reviews::int AS total_reviews,
             r.price_range, r.cuisine_types,
             r.prep_time_avg_minutes::int AS prep_time_avg_minutes,
             r.is_open
      FROM "restaurants" r
      WHERE r.is_active = true
        AND ST_DWithin(r.location, ${point()}, CAST(${radiusMeters} AS double precision))
        ${cuisineFilter}
      ORDER BY dist_km
      LIMIT ${limit} OFFSET ${offset}
    `)

    const countResult = await this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM "restaurants" r
      WHERE r.is_active = true
        AND ST_DWithin(r.location, ${point()}, CAST(${radiusMeters} AS double precision))
        ${cuisineFilter}
    `)
    const total = countResult[0]?.total ?? 0

    return { items, total, page, limit }
  }

  async search(dto: SearchQueryDto) {
    const { q, page, limit } = dto
    const where: Prisma.RestaurantWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    }

    const [items, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          addressLine: true,
          district: true,
          city: true,
          cuisineTypes: true,
          priceRange: true,
          rating: true,
          totalReviews: true,
          isOpen: true,
          prepTimeAvgMinutes: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ])

    return { items, total, page, limit }
  }

  async getDetail(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        openingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    })
    if (!restaurant) throw new NotFoundException('Restaurant not found')
    return restaurant
  }

  async getMenu(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        categories: {
          where: { isVisible: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
              where: { isAvailable: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                options: {
                  orderBy: { createdAt: 'asc' },
                  include: { values: true },
                },
              },
            },
          },
        },
      },
    })
    if (!restaurant) throw new NotFoundException('Restaurant not found')
    return {
      categories: restaurant.categories.map(category => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        items: category.menuItems.map(item => ({
          id: item.id,
          restaurantId: restaurant.id,
          name: item.name,
          description: item.description ?? '',
          imageUrl: item.imageUrl ?? '',
          basePrice: Number(item.basePrice),
          isAvailable: item.isAvailable,
          isPopular: item.isPopular,
          options: item.options.map(option => ({
            id: option.id,
            name: option.name,
            isRequired: option.isRequired,
            isMultiple: option.isMultiple,
            values: option.values.map(value => ({
              id: value.id,
              value: value.value,
              priceModifier: Number(value.priceModifier),
            })),
          })),
        })),
      })),
    }
  }

  async getReviews(id: string, page: number, limit: number) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!restaurant) throw new NotFoundException('Restaurant not found')

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { restaurantId: id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          customer: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.review.count({ where: { restaurantId: id } }),
    ])

    return { items, total, page, limit }
  }
}
