import type { ExportFormat, ExportJobStatus } from '@prisma/client'

export type AdminExportResource =
  | 'audit_logs'
  | 'drivers'
  | 'orders'
  | 'promotions'
  | 'restaurants'
  | 'revenue'
  | 'users'

export interface AdminExportQueryDto {
  limit?: string
  status?: ExportJobStatus | 'processing' | 'all'
}

export interface CreateAdminExportDto {
  resource?: AdminExportResource
  type?: AdminExportResource
  format: ExportFormat
  period?: string
  dateFrom?: string
  dateTo?: string
  filters?: Record<string, unknown>
}
