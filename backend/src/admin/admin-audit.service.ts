import { BadRequestException, Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { AdminAuditQueryDto } from './admin-audit.dto'

const MAX_EXPORT_ROWS = 50_000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminAuditQueryDto) {
    const page = query.page ?? 1
    const limit = query.limit ?? 50
    const where = this.buildWhere(query)
    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { id: true, email: true, fullName: true } } },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ])

    return {
      data: logs.map(log => ({ ...log, id: log.id.toString() })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async exportCsv(query: AdminAuditQueryDto): Promise<string> {
    const logs = await this.prisma.adminAuditLog.findMany({
      where: this.buildWhere(query),
      take: MAX_EXPORT_ROWS,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { email: true, fullName: true } } },
    })
    const header = ['timestamp', 'admin', 'action', 'target_type', 'target_id', 'ip_address', 'correlation_id']
    const rows = logs.map(log => [
      log.createdAt.toISOString(),
      log.admin.email ?? log.admin.fullName,
      log.action,
      log.targetType,
      log.targetId,
      log.ipAddress,
      log.correlationId,
    ])

    return `\uFEFF${[header, ...rows].map(row => row.map(toCsvCell).join(',')).join('\n')}`
  }

  private buildWhere(query: AdminAuditQueryDto): Prisma.AdminAuditLogWhereInput {
    const dateFrom = query.dateFrom ? parseDateBoundary(query.dateFrom, false) : undefined
    const dateTo = query.dateTo ? parseDateBoundary(query.dateTo, true) : undefined
    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException('AUDIT_DATE_RANGE_INVALID')
    }

    return {
      ...(query.action ? { action: { contains: query.action, mode: 'insensitive' as const } } : {}),
      ...(dateFrom || dateTo ? { createdAt: { gte: dateFrom, lte: dateTo } } : {}),
      ...(query.actor ? {
        OR: [
          ...(UUID_PATTERN.test(query.actor) ? [{ adminId: query.actor }] : []),
          { admin: { email: { contains: query.actor, mode: 'insensitive' as const } } },
          { admin: { fullName: { contains: query.actor, mode: 'insensitive' as const } } },
        ],
      } : {}),
    }
  }
}

function toCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value)
  const safe = /^[=+@-]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}

function parseDateBoundary(value: string, endOfDay: boolean): Date {
  const date = new Date(value)
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setUTCHours(23, 59, 59, 999)
  }
  return date
}
