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
    const isCsv = format === ExportFormat.csv
    const status = isCsv ? ExportJobStatus.completed : ExportJobStatus.failed
    const errorMessage = isCsv
      ? null
      : `${format.toUpperCase()} export worker is not configured yet. Use CSV until file generation storage is available.`

    const job = await this.prisma.adminExportJob.create({
      data: {
        requestedById: adminId,
        resource,
        format,
        status,
        filters: filters as Prisma.InputJsonValue,
        progress: isCsv ? 100 : 0,
        fileUrl: isCsv ? 'download' : null,
        errorMessage,
        expiresAt: isCsv ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
      },
      include: { requestedBy: { select: { id: true, email: true, fullName: true } } },
    })

    return this.toResponse(job)
  }

  async getDownload(id: string) {
    const job = await this.prisma.adminExportJob.findUnique({ where: { id } })
    if (!job) throw new NotFoundException('EXPORT_JOB_NOT_FOUND')
    if (job.status !== ExportJobStatus.completed || job.format !== ExportFormat.csv) {
      throw new BadRequestException('EXPORT_JOB_NOT_READY')
    }

    const rows = await getExportRows(this.prisma, job.resource as AdminExportResource, asFilters(job.filters))
    const csv = toCsv(rows)
    return {
      filename: `foodflow-${job.resource}-${job.createdAt.toISOString().slice(0, 10)}.csv`,
      csv,
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
