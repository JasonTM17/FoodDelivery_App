import { ConflictException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'

export async function assertStaffShift(
  prisma: PrismaService,
  restaurantId: string,
  profileId: string,
  startsAt: Date,
  endsAt: Date,
  excludeId?: string,
): Promise<void> {
  if (endsAt <= startsAt) throw new ConflictException('SHIFT_END_BEFORE_START')
  const profile = await prisma.restaurantProfile.findFirst({
    where: { id: profileId, restaurantId, isActive: true },
  })
  if (!profile) throw new NotFoundException('STAFF_MEMBER_NOT_FOUND')
  const overlap = await prisma.staffShift.findFirst({
    where: {
      id: excludeId ? { not: excludeId } : undefined,
      restaurantId,
      restaurantProfileId: profileId,
      status: 'scheduled',
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  })
  if (overlap) throw new ConflictException('SHIFT_OVERLAP')
}
