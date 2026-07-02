import { OrderStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { AdminExportResource } from './admin-export.dto'
import { createdAtWhere, CsvRow, ExportFilters } from './admin-export.helpers'

const COMPLETED_ORDER_STATUSES: OrderStatus[] = [OrderStatus.delivered, OrderStatus.completed]
const EXPORT_ROW_LIMIT = 50_000

export function countExportRows(
  prisma: PrismaService,
  resource: AdminExportResource,
  filters: ExportFilters,
): Promise<number> {
  const createdAt = createdAtWhere(filters)

  switch (resource) {
    case 'audit_logs':
      return prisma.adminAuditLog.count({ where: createdAt ? { createdAt } : {} })
    case 'drivers':
      return prisma.driverProfile.count({ where: createdAt ? { user: { createdAt } } : {} })
    case 'orders':
    case 'revenue':
      return prisma.order.count({
        where: {
          ...(createdAt ? { createdAt } : {}),
          ...(resource === 'revenue' ? { status: { in: COMPLETED_ORDER_STATUSES } } : {}),
        },
      })
    case 'promotions':
      return prisma.promotion.count({ where: createdAt ? { createdAt } : {} })
    case 'restaurants':
      return prisma.restaurant.count({ where: createdAt ? { createdAt } : {} })
    case 'users':
      return prisma.user.count({ where: createdAt ? { createdAt } : {} })
  }
}

export async function getExportRows(
  prisma: PrismaService,
  resource: AdminExportResource,
  filters: ExportFilters,
): Promise<CsvRow[]> {
  const createdAt = createdAtWhere(filters)

  switch (resource) {
    case 'audit_logs':
      return (await prisma.adminAuditLog.findMany({
        where: createdAt ? { createdAt } : {},
        take: EXPORT_ROW_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { email: true, fullName: true } } },
      })).map(log => ({
        createdAt: log.createdAt.toISOString(),
        actor: log.admin.email ?? log.admin.fullName,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId ?? '',
        correlationId: log.correlationId ?? '',
      }))
    case 'drivers':
      return (await prisma.driverProfile.findMany({
        where: createdAt ? { user: { createdAt } } : {},
        take: EXPORT_ROW_LIMIT,
        include: { user: { select: { email: true, phone: true, fullName: true, createdAt: true } } },
      })).map(driver => ({
        name: driver.user.fullName,
        email: driver.user.email,
        phone: driver.user.phone ?? '',
        isOnline: driver.isOnline,
        isVerified: driver.isVerified,
        rating: Number(driver.rating),
        totalDeliveries: driver.totalDeliveries,
        createdAt: driver.user.createdAt.toISOString(),
      }))
    case 'orders':
    case 'revenue':
      return (await prisma.order.findMany({
        where: {
          ...(createdAt ? { createdAt } : {}),
          ...(resource === 'revenue' ? { status: { in: COMPLETED_ORDER_STATUSES } } : {}),
        },
        take: EXPORT_ROW_LIMIT,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { email: true, fullName: true } }, restaurant: { select: { name: true } } },
      })).map(order => ({
        createdAt: order.createdAt.toISOString(),
        orderCode: order.orderCode,
        status: order.status,
        restaurant: order.restaurant.name,
        customer: order.customer.email ?? order.customer.fullName,
        subtotal: Number(order.subtotal),
        discount: Number(order.promotionDiscount),
        total: Number(order.total),
      }))
    case 'promotions':
      return (await prisma.promotion.findMany({
        where: createdAt ? { createdAt } : {},
        take: EXPORT_ROW_LIMIT,
        orderBy: { createdAt: 'desc' },
      })).map(promotion => ({
        code: promotion.code,
        name: promotion.name,
        status: promotion.status,
        isActive: promotion.isActive,
        type: promotion.type,
        value: Number(promotion.value),
        startsAt: promotion.startsAt.toISOString(),
        expiresAt: promotion.expiresAt.toISOString(),
      }))
    case 'restaurants':
      return (await prisma.restaurant.findMany({
        where: createdAt ? { createdAt } : {},
        take: EXPORT_ROW_LIMIT,
        orderBy: { createdAt: 'desc' },
      })).map(restaurant => ({
        createdAt: restaurant.createdAt.toISOString(),
        name: restaurant.name,
        city: restaurant.city,
        district: restaurant.district ?? '',
        approvalStatus: restaurant.approvalStatus,
        isActive: restaurant.isActive,
        isOpen: restaurant.isOpen,
      }))
    case 'users':
      return (await prisma.user.findMany({
        where: createdAt ? { createdAt } : {},
        take: EXPORT_ROW_LIMIT,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, email: true, phone: true, fullName: true, role: true, isActive: true },
      })).map(user => ({
        createdAt: user.createdAt.toISOString(),
        email: user.email,
        phone: user.phone ?? '',
        name: user.fullName,
        role: user.role,
        isActive: user.isActive,
      }))
  }
}
