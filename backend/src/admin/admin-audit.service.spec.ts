import { BadRequestException } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import { AdminAuditService } from './admin-audit.service'

describe('AdminAuditService', () => {
  const findMany = jest.fn()
  const count = jest.fn()
  const service = new AdminAuditService({
    adminAuditLog: { findMany, count },
  } as unknown as PrismaService)

  beforeEach(() => {
    jest.clearAllMocks()
    findMany.mockResolvedValue([makeAuditLog()])
    count.mockResolvedValue(1)
  })

  it('applies filters and serializes bigint identifiers in the paginated envelope', async () => {
    const result = await service.list({
      actor: 'admin@example.com',
      action: 'promotion',
      dateFrom: '2026-07-01T00:00:00.000Z',
      dateTo: '2026-07-31',
      page: 2,
      limit: 25,
    })

    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 25,
      take: 25,
      where: expect.objectContaining({
        action: { contains: 'promotion', mode: 'insensitive' },
        OR: expect.arrayContaining([
          { admin: { email: { contains: 'admin@example.com', mode: 'insensitive' } } },
        ]),
      }),
    }))
    expect(result.data[0]?.id).toBe('42')
    expect(result.meta).toEqual({ page: 2, limit: 25, total: 1, totalPages: 1 })
    expect(findMany.mock.calls[0][0].where.createdAt.lte).toEqual(
      new Date('2026-07-31T23:59:59.999Z'),
    )
  })

  it('rejects an inverted date range before querying', async () => {
    await expect(service.list({
      dateFrom: '2026-07-02T00:00:00.000Z',
      dateTo: '2026-07-01T00:00:00.000Z',
    })).rejects.toThrow(BadRequestException)

    expect(findMany).not.toHaveBeenCalled()
  })

  it('exports UTF-8 CSV and neutralizes spreadsheet formulas', async () => {
    findMany.mockResolvedValue([makeAuditLog({ action: '=HYPERLINK("bad")' })])

    const csv = await service.exportCsv({})

    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"')
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50_000 }))
  })
})

function makeAuditLog(overrides: Record<string, unknown> = {}) {
  return {
    id: 42n,
    adminId: '8e65cf48-5f95-4b8e-94cc-3e14062b6339',
    action: 'promotion.updated',
    targetType: 'promotion',
    targetId: null,
    oldValue: null,
    newValue: null,
    ipAddress: '127.0.0.1',
    userAgent: 'Jest',
    correlationId: 'request-1',
    severity: 'info',
    metadata: null,
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
    admin: {
      id: '8e65cf48-5f95-4b8e-94cc-3e14062b6339',
      email: 'admin@example.com',
      fullName: 'Admin User',
    },
    ...overrides,
  }
}
