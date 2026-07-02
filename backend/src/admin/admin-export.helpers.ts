import { BadRequestException } from '@nestjs/common'
import { ExportFormat, ExportJobStatus, Prisma } from '@prisma/client'
import { AdminExportQueryDto, AdminExportResource, CreateAdminExportDto } from './admin-export.dto'

const EXPORT_RESOURCES: AdminExportResource[] = [
  'audit_logs',
  'drivers',
  'orders',
  'promotions',
  'restaurants',
  'revenue',
  'users',
]

const EXPORT_FORMATS: ExportFormat[] = [ExportFormat.csv, ExportFormat.xlsx, ExportFormat.parquet]

export type CsvRow = Record<string, string | number | boolean | null | undefined>
export type ExportFilters = Record<string, unknown>

export function normalizeResource(resource: unknown): AdminExportResource {
  if (typeof resource !== 'string' || !EXPORT_RESOURCES.includes(resource as AdminExportResource)) {
    throw new BadRequestException('EXPORT_RESOURCE_UNSUPPORTED')
  }
  return resource as AdminExportResource
}

export function normalizeFormat(format: unknown): ExportFormat {
  if (typeof format !== 'string' || !EXPORT_FORMATS.includes(format as ExportFormat)) {
    throw new BadRequestException('EXPORT_FORMAT_UNSUPPORTED')
  }
  return format as ExportFormat
}

export function normalizeStatus(status: AdminExportQueryDto['status']): ExportJobStatus | undefined {
  if (!status || status === 'all') return undefined
  if (status === 'processing') return ExportJobStatus.running
  if (!Object.values(ExportJobStatus).includes(status as ExportJobStatus)) {
    throw new BadRequestException('EXPORT_STATUS_UNSUPPORTED')
  }
  return status as ExportJobStatus
}

export function normalizeFilters(dto: CreateAdminExportDto): ExportFilters {
  return {
    ...(dto.filters ?? {}),
    ...(dto.period ? { period: dto.period } : {}),
    ...(dto.dateFrom ? { dateFrom: dto.dateFrom } : {}),
    ...(dto.dateTo ? { dateTo: dto.dateTo } : {}),
  }
}

export function asFilters(value: Prisma.JsonValue | null): ExportFilters {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ExportFilters : {}
}

export function createdAtWhere(filters: ExportFilters): Prisma.DateTimeFilter | undefined {
  const now = new Date()
  const period = typeof filters.period === 'string' ? filters.period : undefined
  const dateFrom = typeof filters.dateFrom === 'string' ? filters.dateFrom : undefined
  const dateTo = typeof filters.dateTo === 'string' ? filters.dateTo : undefined
  let gte: Date | undefined
  let lte: Date | undefined

  if (period === 'today') {
    gte = new Date(now)
    gte.setHours(0, 0, 0, 0)
  } else if (period === '7d' || period === '30d') {
    const days = period === '7d' ? 7 : 30
    gte = new Date(now.getTime() - days * 86_400_000)
  } else if (period === 'thisMonth') {
    gte = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  } else if (period === 'thisQuarter') {
    gte = new Date(Date.UTC(now.getUTCFullYear(), Math.floor(now.getUTCMonth() / 3) * 3, 1))
  }

  if (dateFrom) gte = parseDateBoundary(dateFrom, false)
  if (dateTo) lte = parseDateBoundary(dateTo, true)
  return gte || lte ? { gte, lte } : undefined
}

export function toFilterSummary(filters: ExportFilters): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]),
  )
}

export function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return '\uFEFF'
  const header = Object.keys(rows[0])
  const body = [header, ...rows.map(row => header.map(key => row[key]))]
    .map(row => row.map(toCsvCell).join(','))
    .join('\n')
  return `\uFEFF${body}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function parseDateBoundary(value: string, endOfDay: boolean): Date {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new BadRequestException('EXPORT_DATE_INVALID')
  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) date.setUTCHours(23, 59, 59, 999)
  return date
}

function toCsvCell(value: unknown): string {
  const raw = value === null || value === undefined ? '' : String(value)
  const safe = /^[=+@-]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replace(/"/g, '""')}"`
}
