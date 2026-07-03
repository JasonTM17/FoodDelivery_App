import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, StaffRole } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'
import { PrismaService } from '../database/prisma.service'
import { RestaurantAccessService } from './restaurant-access.service'
import { normalizeStaffCapabilities } from './restaurant-staff-capabilities'
import { CreateShiftDto, InviteStaffDto, UpdateShiftDto, UpdateStaffDto } from './restaurant-staff.dto'
import { assertStaffShift } from './restaurant-staff-shift-validation'

@Injectable()
export class RestaurantStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: RestaurantAccessService,
  ) {}

  async list(userId: string) {
    const actor = await this.access.getProfile(userId)
    const [staff, invites, shifts] = await Promise.all([
      this.prisma.restaurantProfile.findMany({
        where: { restaurantId: actor.restaurantId },
        include: { user: { select: { fullName: true, email: true, avatarUrl: true } } },
        orderBy: [{ staffRole: 'asc' }, { joinedAt: 'asc' }],
      }),
      this.prisma.staffInvite.findMany({
        where: {
          restaurantId: actor.restaurantId,
          status: 'pending',
          expiresAt: { gt: new Date() },
        },
        select: {
          id: true,
          email: true,
          role: true,
          permissions: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.staffShift.findMany({
        where: { restaurantId: actor.restaurantId, startsAt: { gte: new Date(Date.now() - 7 * 86_400_000) } },
        orderBy: { startsAt: 'asc' }, take: 200,
      }),
    ])
    return {
      staff: staff.map(member => ({
        id: member.id, userId: member.userId, name: member.user.fullName,
        email: member.user.email, avatar: member.user.avatarUrl, role: member.staffRole,
        permissions: normalizeStaffCapabilities(member.permissions), isActive: member.isActive,
        joinedAt: member.joinedAt,
      })),
      invites: invites.map(invite => ({
        ...invite,
        permissions: normalizeStaffCapabilities(invite.permissions),
      })),
      shifts,
    }
  }

  async invite(userId: string, dto: InviteStaffDto) {
    const actor = await this.requireManager(userId)
    if (actor.staffRole === 'manager' && dto.role === 'manager') {
      throw new ForbiddenException('MANAGER_CANNOT_INVITE_MANAGER')
    }
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 86_400_000)
    const created: Array<{
      id: string
      email: string
      role: StaffRole
      permissions: string[]
      status: string
      expiresAt: Date
      createdAt: Date
      token: string
    }> = []
    for (const rawEmail of dto.emails) {
      const email = rawEmail.trim().toLowerCase()
      const existingMember = await this.prisma.user.findFirst({
        where: { email, restaurantProfile: { restaurantId: actor.restaurantId } }, select: { id: true },
      })
      if (existingMember) continue
      const existingInvite = await this.prisma.staffInvite.findFirst({
        where: {
          restaurantId: actor.restaurantId,
          email,
          status: 'pending',
          expiresAt: { gt: now },
        },
        select: { id: true },
      })
      if (existingInvite) continue
      const rawToken = randomBytes(32).toString('base64url')
      const tokenHash = createHash('sha256').update(rawToken).digest('hex')
      const invite = await this.prisma.staffInvite.create({
        data: {
          restaurantId: actor.restaurantId, email, role: dto.role as StaffRole,
          permissions: (dto.permissions ?? []) as Prisma.InputJsonValue,
          tokenHash, invitedById: userId, expiresAt,
        },
      })
      created.push({
        id: invite.id,
        email,
        role: invite.role,
        permissions: normalizeStaffCapabilities(invite.permissions),
        status: invite.status,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        token: rawToken,
      })
    }
    return { invites: created }
  }

  async update(userId: string, profileId: string, dto: UpdateStaffDto) {
    const actor = await this.requireManager(userId)
    const target = await this.prisma.restaurantProfile.findFirst({
      where: { id: profileId, restaurantId: actor.restaurantId },
    })
    if (!target) throw new NotFoundException('STAFF_MEMBER_NOT_FOUND')
    if (target.staffRole === 'owner') {
      throw new ForbiddenException('OWNER_CANNOT_BE_MODIFIED')
    }
    if (
      actor.staffRole === 'manager'
      && (target.staffRole === 'manager' || dto.role === 'manager')
    ) {
      throw new ForbiddenException('MANAGER_CANNOT_MANAGE_MANAGER')
    }
    if (target.id === actor.id && dto.isActive === false) {
      throw new ForbiddenException('STAFF_CANNOT_DEACTIVATE_SELF')
    }
    const updated = await this.prisma.restaurantProfile.update({
      where: { id: profileId },
      data: {
        ...(dto.role ? { staffRole: dto.role as StaffRole } : {}),
        ...(dto.permissions ? { permissions: dto.permissions } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: { user: { select: { fullName: true, email: true, avatarUrl: true } } },
    })
    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.user.fullName,
      email: updated.user.email,
      avatar: updated.user.avatarUrl,
      role: updated.staffRole,
      permissions: normalizeStaffCapabilities(updated.permissions),
      isActive: updated.isActive,
      joinedAt: updated.joinedAt,
    }
  }

  async createShift(userId: string, dto: CreateShiftDto) {
    const actor = await this.requireManager(userId)
    const startsAt = new Date(dto.startsAt)
    const endsAt = new Date(dto.endsAt)
    await assertStaffShift(this.prisma, actor.restaurantId, dto.restaurantProfileId, startsAt, endsAt)
    return this.prisma.staffShift.create({
      data: { restaurantId: actor.restaurantId, restaurantProfileId: dto.restaurantProfileId, startsAt, endsAt, note: dto.note },
    })
  }

  async updateShift(userId: string, id: string, dto: UpdateShiftDto) {
    const actor = await this.requireManager(userId)
    const shift = await this.prisma.staffShift.findFirst({ where: { id, restaurantId: actor.restaurantId } })
    if (!shift) throw new NotFoundException('SHIFT_NOT_FOUND')
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : shift.startsAt
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : shift.endsAt
    await assertStaffShift(this.prisma, actor.restaurantId, shift.restaurantProfileId, startsAt, endsAt, id)
    return this.prisma.staffShift.update({
      where: { id }, data: { startsAt, endsAt, note: dto.note, status: dto.status },
    })
  }

  async deleteShift(userId: string, id: string) {
    const actor = await this.requireManager(userId)
    const result = await this.prisma.staffShift.deleteMany({ where: { id, restaurantId: actor.restaurantId } })
    if (!result.count) throw new NotFoundException('SHIFT_NOT_FOUND')
    return { deleted: true }
  }

  private async requireManager(userId: string) {
    const profile = await this.access.getProfile(userId)
    const canManageStaff = profile.staffRole === 'owner'
      || (
        profile.staffRole === 'manager'
        && normalizeStaffCapabilities(profile.permissions).includes('staff')
      )
    if (!canManageStaff) throw new ForbiddenException('STAFF_MANAGE_FORBIDDEN')
    return profile
  }
}
