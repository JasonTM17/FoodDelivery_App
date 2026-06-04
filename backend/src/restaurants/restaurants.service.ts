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

    const hasCuisine = !!cuisine
    const params: unknown[] = hasCuisine
      ? [lng, lat, radiusMeters, cuisine, limit, offset]
      : [lng, lat, radiusMeters, limit, offset]

    const limitIdx = hasCuisine ? 5 : 4
    const offsetIdx = hasCuisine ? 6 : 5
    const cuisineFilter = hasCuisine
      ? ' AND r.cuisine_types @> ARRAY[$4::text]'
      : ''

    const sql = `
      SELECT r.id, r.name, r.slug, r.logo_url, r.address_line, r.district,
             (ST_Distance(r.location, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography) / 1000)::float AS dist_km,
             r.rating::float AS rating,
             r.total_reviews::int AS total_reviews,
             r.price_range, r.cuisine_types,
             r.prep_time_avg_minutes::int AS prep_time_avg_minutes,
             r.is_open
      FROM "restaurants" r
      WHERE r.is_active = true
        AND ST_DWithin(r.location, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography, $3::float8)
        ${cuisineFilter}
      ORDER BY dist_km
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `

    const items = await this.prisma.$queryRawUnsafe<NearbyRestaurantRow[]>(sql, ...params)

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM "restaurants" r
      WHERE r.is_active = true
        AND ST_DWithin(r.location, ST_SetSRID(ST_MakePoint($1::float8, $2::float8), 4326)::geography, $3::float8)
        ${cuisineFilter}
    `
    const countParams: unknown[] = hasCuisine
      ? [lng, lat, radiusMeters, cuisine]
      : [lng, lat, radiusMeters]
    const countResult = await this.prisma.$queryRawUnsafe<{ total: number }[]>(countSql, ...countParams)
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
      include: {
        openingHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            menuItems: {
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
