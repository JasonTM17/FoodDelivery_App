import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { UpdateUserDto } from './users.dto'
import { UserRole } from '@prisma/client'

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
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        label: true,
        addressLine: true,
        isDefault: true,
        createdAt: true,
      },
    })
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
