import { BadRequestException } from '@nestjs/common'
import { ExportFormat, ExportJobStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { AdminExportService } from './admin-export.service'

describe('AdminExportService', () => {
  const adminExportJob = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  }
  const adminAuditLog = {
    count: jest.fn(),
    findMany: jest.fn(),
  }
  const service = new AdminExportService({
    adminExportJob,
    adminAuditLog,
  } as unknown as PrismaService)

  beforeEach(() => {
    jest.clearAllMocks()
    adminAuditLog.count.mockResolvedValue(2)
    adminAuditLog.findMany.mockResolvedValue([
      makeAuditLog(),
      makeAuditLog({ action: '=HYPERLINK("bad")' }),
    ])
  })

  it('creates a completed CSV job with canonical download metadata', async () => {
    adminExportJob.create.mockImplementation(({ data }) => ({
      ...makeJob(),
      ...data,
      requestedBy: makeRequester(),
    }))

    const result = await service.create('admin-1', {
      resource: 'audit_logs',
      format: ExportFormat.csv,
      period: '7d',
    })

    expect(adminExportJob.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        requestedById: 'admin-1',
        resource: 'audit_logs',
        format: ExportFormat.csv,
        status: ExportJobStatus.completed,
        progress: 100,
        fileUrl: 'download',
      }),
    }))
    expect(result.downloadUrl).toBe('/admin/exports/export-1/download')
    expect(result.rowCount).toBe(2)
    expect(result.filterSummary).toEqual({ period: '7d' })
  })

  it('creates a completed XLSX job with canonical download metadata', async () => {
    adminExportJob.create.mockImplementation(({ data }) => ({
      ...makeJob(),
      ...data,
      requestedBy: makeRequester(),
    }))

    const result = await service.create('admin-1', {
      resource: 'audit_logs',
      format: ExportFormat.xlsx,
    })

    expect(result.status).toBe(ExportJobStatus.completed)
    expect(result.downloadUrl).toBe('/admin/exports/export-1/download')
    expect(result.rowCount).toBe(2)
    expect(result.errorMessage).toBeUndefined()
  })

  it('marks Parquet as failed when export storage workers are unavailable', async () => {
    adminExportJob.create.mockImplementation(({ data }) => ({
      ...makeJob(),
      ...data,
      requestedBy: makeRequester(),
    }))

    const result = await service.create('admin-1', {
      resource: 'orders',
      format: ExportFormat.parquet,
    })

    expect(result.status).toBe(ExportJobStatus.failed)
    expect(result.downloadUrl).toBeUndefined()
    expect(result.rowCount).toBe(0)
    expect(result.errorMessage).toContain('PARQUET export worker is not configured')
  })

  it('downloads UTF-8 CSV and neutralizes spreadsheet formulas', async () => {
    adminExportJob.findUnique.mockResolvedValue(makeJob({
      format: ExportFormat.csv,
      status: ExportJobStatus.completed,
    }))

    const result = await service.getDownload('export-1')

    expect(result.filename).toBe('foodflow-audit_logs-2026-07-02.csv')
    expect(result.contentType).toBe('text/csv; charset=utf-8')
    expect(String(result.body).startsWith('\uFEFF')).toBe(true)
    expect(String(result.body)).toContain('"\'=HYPERLINK(""bad"")"')
    expect(adminAuditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50_000 }))
  })

  it('downloads a real XLSX workbook and neutralizes spreadsheet formulas', async () => {
    adminExportJob.findUnique.mockResolvedValue(makeJob({
      format: ExportFormat.xlsx,
      status: ExportJobStatus.completed,
    }))

    const result = await service.getDownload('export-1')

    expect(result.filename).toBe('foodflow-audit_logs-2026-07-02.xlsx')
    expect(result.contentType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(Buffer.isBuffer(result.body)).toBe(true)
    expect((result.body as Buffer).subarray(0, 2).toString('utf8')).toBe('PK')
    expect((result.body as Buffer).toString('utf8')).toContain('&apos;=HYPERLINK(&quot;bad&quot;)')
  })

  it('rejects downloads for jobs without a real CSV file', async () => {
    adminExportJob.findUnique.mockResolvedValue(makeJob({
      format: ExportFormat.parquet,
      status: ExportJobStatus.failed,
    }))

    await expect(service.getDownload('export-1')).rejects.toThrow(BadRequestException)
  })
})

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'export-1',
    requestedById: 'admin-1',
    resource: 'audit_logs',
    format: ExportFormat.csv,
    status: ExportJobStatus.completed,
    filters: null,
    progress: 100,
    fileUrl: 'download',
    errorMessage: null,
    expiresAt: new Date('2026-07-03T00:00:00.000Z'),
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    requestedBy: makeRequester(),
    ...overrides,
  }
}

function makeRequester() {
  return { id: 'admin-1', email: 'admin@example.com', fullName: 'Admin User' }
}

function makeAuditLog(overrides: Record<string, unknown> = {}) {
  return {
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    admin: { email: 'admin@example.com', fullName: 'Admin User' },
    action: 'export.created',
    targetType: 'export',
    targetId: 'export-1',
    correlationId: 'request-1',
    ...overrides,
  }
}
