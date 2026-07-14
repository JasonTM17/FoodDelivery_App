import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { CreateAddressDto, UpdateAddressDto, UpdateUserDto } from './users.dto'
import { Prisma, UserRole } from '@prisma/client'
import { isWithinVietnamDeliveryBounds } from '../common/utils/delivery-area.utils'

type AddressRow = {
  id: string
  label: string
  addressLine: string
  latitude: number
  longitude: number
  isDefault: boolean
  createdAt: Date
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, phone: true, fullName: true, role: true,
        avatarUrl: true, isActive: true, createdAt: true, updatedAt: true,
        customerProfile: true, driverProfile: true,
        restaurantProfile: { include: { restaurant: true } },
      },
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async listAddresses(userId: string) {
    const rows = await this.prisma.$queryRaw<AddressRow[]>(Prisma.sql`
      SELECT
        id::text AS "id",
        label,
        address_line AS "addressLine",
        ST_Y(location::geometry)::float8 AS "latitude",
        ST_X(location::geometry)::float8 AS "longitude",
        is_default AS "isDefault",
        created_at AS "createdAt"
      FROM addresses
      WHERE user_id = CAST(${userId} AS uuid)
      ORDER BY is_default DESC, created_at DESC
    `)
    return rows.map(serializeAddress)
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    const { latitude, longitude } = requireAddressCoordinates(dto)
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await lockAddressDefaults(tx, userId)
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        })
      }

      const rows = await tx.$queryRaw<AddressRow[]>(Prisma.sql`
        INSERT INTO addresses (id, user_id, label, address_line, location, is_default)
        VALUES (
          gen_random_uuid(),
          CAST(${userId} AS uuid),
          ${dto.label.trim()},
          ${dto.addressLine.trim()},
          ST_SetSRID(
            ST_MakePoint(CAST(${longitude} AS double precision), CAST(${latitude} AS double precision)),
            4326
          )::geography,
          ${dto.isDefault === true}
        )
        RETURNING
          id::text AS "id",
          label,
          address_line AS "addressLine",
          ST_Y(location::geometry)::float8 AS "latitude",
          ST_X(location::geometry)::float8 AS "longitude",
          is_default AS "isDefault",
          created_at AS "createdAt"
      `)
      return serializeAddress(rows[0])
    })
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const coordinates = optionalAddressCoordinates(dto)
    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true) {
        await lockAddressDefaults(tx, userId)
        await tx.address.updateMany({
          where: { userId, id: { not: addressId } },
          data: { isDefault: false },
        })
      }

      const rows = await tx.$queryRaw<AddressRow[]>(Prisma.sql`
        UPDATE addresses
        SET
          label = COALESCE(${trimmedOrNull(dto.label)}, label),
          address_line = COALESCE(${trimmedOrNull(dto.addressLine)}, address_line),
          is_default = COALESCE(${dto.isDefault ?? null}, is_default),
          location = CASE
            WHEN ${coordinates !== null} THEN ST_SetSRID(
              ST_MakePoint(
                CAST(${coordinates?.longitude ?? null} AS double precision),
                CAST(${coordinates?.latitude ?? null} AS double precision)
              ),
              4326
            )::geography
            ELSE location
          END
        WHERE id = CAST(${addressId} AS uuid)
          AND user_id = CAST(${userId} AS uuid)
        RETURNING
          id::text AS "id",
          label,
          address_line AS "addressLine",
          ST_Y(location::geometry)::float8 AS "latitude",
          ST_X(location::geometry)::float8 AS "longitude",
          is_default AS "isDefault",
          created_at AS "createdAt"
      `)
      if (!rows[0]) throw new NotFoundException('ADDRESS_NOT_FOUND')
      return serializeAddress(rows[0])
    })
  }

  async deleteAddress(userId: string, addressId: string) {
    const result = await this.prisma.address.deleteMany({
      where: { id: addressId, userId },
    })
    if (result.count === 0) throw new NotFoundException('ADDRESS_NOT_FOUND')
    return { success: true }
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: { id: true, email: true, phone: true, fullName: true, role: true, avatarUrl: true, updatedAt: true },
    })
  }

  // Used by AuthService
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async create(data: { email: string; passwordHash: string; fullName: string; phone?: string | null; role: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone ?? null,
        role: data.role as UserRole,
      },
    })
  }
}

function requireAddressCoordinates(dto: CreateAddressDto): { latitude: number; longitude: number } {
  const coordinates = optionalAddressCoordinates(dto)
  if (!coordinates) throw new BadRequestException('ADDRESS_LOCATION_REQUIRED')
  return coordinates
}

async function lockAddressDefaults(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<void> {
  const rows = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
    SELECT id::text AS "id"
    FROM users
    WHERE id = CAST(${userId} AS uuid)
    FOR UPDATE
  `)
  if (!rows[0]) throw new NotFoundException('User not found')
}

function optionalAddressCoordinates(
  dto: Pick<CreateAddressDto | UpdateAddressDto, 'latitude' | 'longitude' | 'lat' | 'lng'>,
): { latitude: number; longitude: number } | null {
  const latitude = dto.latitude ?? dto.lat
  const longitude = dto.longitude ?? dto.lng
  const hasAnyCoordinate = latitude !== undefined || longitude !== undefined

  if (!hasAnyCoordinate) return null
  if (!isWithinVietnamDeliveryBounds(latitude, longitude)) {
    throw new BadRequestException('ADDRESS_LOCATION_INVALID')
  }
  return { latitude: latitude!, longitude: longitude! }
}

function trimmedOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function serializeAddress(row: AddressRow) {
  return {
    id: row.id,
    label: row.label,
    addressLine: row.addressLine,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    isDefault: row.isDefault,
    createdAt: row.createdAt,
  }
}
