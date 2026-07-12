import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ExportFormat, ExportJobStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { CreateAdminExportDto, AdminExportQueryDto, AdminExportResource } from './admin-export.dto'
import { countExportRows, getExportRows } from './admin-export-data'
import {
  asFilters,
  clamp,
  normalizeFilters,
  normalizeFormat,
  normalizeResource,
  normalizeStatus,
  toCsv,
  toFilterSummary,
} from './admin-export.helpers'
import { toXlsx } from './admin-export-xlsx'

export interface AdminExportDownload {
  filename: string
  contentType: string
  body: string | Buffer
}

@Injectable()
export class AdminExportService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminExportQueryDto) {
    const limit = clamp(Number(query.limit) || 30, 1, 100)
    const status = normalizeStatus(query.status)
    const where: Prisma.AdminExportJobWhereInput = status ? { status } : {}
    const jobs = await this.prisma.adminExportJob.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { requestedBy: { select: { id: true, email: true, fullName: true } } },
    })

    return {
      jobs: await Promise.all(jobs.map(job => this.toResponse(job))),
    }
  }

  async create(adminId: string, dto: CreateAdminExportDto) {
    const resource = normalizeResource(dto.resource ?? dto.type)
    const format = normalizeFormat(dto.format)
    const filters = normalizeFilters(dto)

    const job = await this.prisma.adminExportJob.create({
      data: {
        requestedById: adminId,
        resource,
        format,
        status: ExportJobStatus.completed,
        filters: filters as Prisma.InputJsonValue,
        progress: 100,
        fileUrl: 'download',
        errorMessage: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: { requestedBy: { select: { id: true, email: true, fullName: true } } },
    })

    return this.toResponse(job)
  }

  async getDownload(id: string): Promise<AdminExportDownload> {
    const job = await this.prisma.adminExportJob.findUnique({ where: { id } })
    if (!job) throw new NotFoundException('EXPORT_JOB_NOT_FOUND')
    if (
      job.status !== ExportJobStatus.completed
      || (job.format !== ExportFormat.csv && job.format !== ExportFormat.xlsx)
    ) {
      throw new BadRequestException('EXPORT_JOB_NOT_READY')
    }

    const rows = await getExportRows(this.prisma, job.resource as AdminExportResource, asFilters(job.filters))
    const date = job.createdAt.toISOString().slice(0, 10)
    if (job.format === ExportFormat.xlsx) {
      return {
        filename: `foodflow-${job.resource}-${date}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: toXlsx(rows),
      }
    }

    return {
      filename: `foodflow-${job.resource}-${date}.csv`,
      contentType: 'text/csv; charset=utf-8',
      body: toCsv(rows),
    }
  }

  private async toResponse(job: ExportJobWithRequester) {
    const filters = asFilters(job.filters)
    const rowCount = job.status === ExportJobStatus.failed
      ? 0
      : await countExportRows(this.prisma, job.resource as AdminExportResource, filters)
    return {
      id: job.id,
      type: job.resource,
      resource: job.resource,
      format: job.format,
      status: job.status,
      progress: job.progress,
      rowCount,
      totalRows: rowCount,
      filterSummary: toFilterSummary(filters),
      requestedBy: job.requestedBy,
      createdAt: job.createdAt,
      completedAt: job.status === ExportJobStatus.completed ? job.updatedAt : undefined,
      downloadUrl: job.status === ExportJobStatus.completed ? `/admin/exports/${job.id}/download` : undefined,
      errorMessage: job.errorMessage ?? undefined,
    }
  }
}

type ExportJobWithRequester = Prisma.AdminExportJobGetPayload<{
  include: { requestedBy: { select: { id: true, email: true, fullName: true } } }
}>
