import { Injectable } from '@nestjs/common'
import { OrderStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { AdminDriversQueryDto, type AdminDriverStatus } from './admin-drivers.dto'

const ACTIVE_DRIVER_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.driver_assigned,
  OrderStatus.driver_arriving_restaurant,
  OrderStatus.picked_up,
  OrderStatus.delivering,
]

const ACTIVE_DRIVER_ORDER_WHERE: Prisma.OrderWhereInput = {
  status: { in: ACTIVE_DRIVER_ORDER_STATUSES },
}

@Injectable()
export class AdminDriversService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminDriversQueryDto) {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const where = buildDriverWhere(query.search, query.status)

    const [profiles, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { user: { createdAt: 'desc' } },
        select: {
          id: true,
          vehicleType: true,
          vehiclePlate: true,
          isOnline: true,
          isVerified: true,
          rating: true,
          totalDeliveries: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
              ordersAsDriver: {
                where: ACTIVE_DRIVER_ORDER_WHERE,
                select: { id: true },
                take: 1,
              },
            },
          },
        },
      }),
      this.prisma.driverProfile.count({ where }),
    ])

    return {
      data: profiles.map(profile => ({
        id: profile.user.id,
        profileId: profile.id,
        name: profile.user.fullName,
        email: profile.user.email,
        phone: profile.user.phone,
        rating: Number(profile.rating),
        totalDeliveries: profile.totalDeliveries,
        status: resolveDriverStatus(profile.isOnline, profile.user.ordersAsDriver.length > 0),
        vehicleType: profile.vehicleType,
        vehiclePlate: profile.vehiclePlate,
        isVerified: profile.isVerified,
        isActive: profile.user.isActive,
        createdAt: profile.user.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}

function buildDriverWhere(search?: string, status?: AdminDriverStatus): Prisma.DriverProfileWhereInput {
  const normalizedSearch = search?.trim()
  const where: Prisma.DriverProfileWhereInput = {}

  if (normalizedSearch) {
    where.OR = [
      { user: { fullName: { contains: normalizedSearch, mode: 'insensitive' } } },
      { user: { email: { contains: normalizedSearch, mode: 'insensitive' } } },
      { user: { phone: { contains: normalizedSearch, mode: 'insensitive' } } },
      { vehiclePlate: { contains: normalizedSearch, mode: 'insensitive' } },
    ]
  }

  if (status === 'delivering') {
    where.user = { ordersAsDriver: { some: ACTIVE_DRIVER_ORDER_WHERE } }
  } else if (status) {
    where.isOnline = status === 'online'
    where.user = { ordersAsDriver: { none: ACTIVE_DRIVER_ORDER_WHERE } }
  }

  return where
}

function resolveDriverStatus(isOnline: boolean, hasActiveOrder: boolean): AdminDriverStatus {
  if (hasActiveOrder) return 'delivering'
  return isOnline ? 'online' : 'offline'
}
