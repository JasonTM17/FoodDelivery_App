import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, TicketPriority, TicketStatus } from '@prisma/client'
import { PrismaService } from '../database/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateSupportMacroDto, SupportBulkDto, SupportCsatDto } from './admin-support.dto'
import { calculateSupportSlaDeadline } from './support-sla'

@Injectable()
export class AdminSupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async getTicket(id: string) {
    const ticket = await this.prisma.aiSupportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        assignedAdmin: { select: { id: true, fullName: true, email: true } },
        order: { select: { id: true, orderCode: true, status: true } },
        messages: { include: { sender: { select: { fullName: true } } }, orderBy: { createdAt: 'asc' } },
        csat: true,
      },
    })
    if (!ticket) throw new NotFoundException('SUPPORT_TICKET_NOT_FOUND')
    if (!ticket.slaDeadlineAt) {
      ticket.slaDeadlineAt = calculateSupportSlaDeadline(ticket.createdAt, ticket.priority)
      await this.prisma.aiSupportTicket.update({ where: { id }, data: { slaDeadlineAt: ticket.slaDeadlineAt } })
    }
    return ticket
  }

  async getMessages(id: string) {
    await this.assertTicket(id)
    return {
      messages: await this.prisma.supportTicketMessage.findMany({
        where: { ticketId: id }, include: { sender: { select: { fullName: true } } }, orderBy: { createdAt: 'asc' },
      }),
    }
  }

  async addMessage(id: string, adminId: string, body: string, internal: boolean) {
    const ticket = await this.getTicket(id)
    const message = await this.prisma.$transaction(async tx => {
      const created = await tx.supportTicketMessage.create({
        data: { ticketId: id, senderId: adminId, body, type: internal ? 'internal_note' : 'public_reply' },
      })
      if (!internal) {
        await tx.aiSupportTicket.update({
          where: { id },
          data: {
            firstRespondedAt: ticket.firstRespondedAt ?? new Date(),
            status: ticket.status === 'open' || ticket.status === 'waiting_customer' ? 'in_progress' : ticket.status,
            waitingStartedAt: null,
          },
        })
      }
      return created
    })
    if (!internal) {
      await this.notifications.create({
        userId: ticket.userId, title: 'Cập nhật yêu cầu hỗ trợ', body,
        type: 'support.reply', payload: { ticketId: id },
      })
    }
    return message
  }

  async bulk(dto: SupportBulkDto) {
    if (dto.action === 'assign') {
      await this.prisma.$transaction(dto.ids.map(id => this.prisma.aiSupportTicket.update({
        where: { id },
        data: { assignedAdmin: { connect: { id: dto.value } } },
      })))
      return { updated: dto.ids.length }
    }

    const data: Prisma.AiSupportTicketUpdateManyMutationInput = {}
    if (dto.action === 'status') data.status = dto.value as TicketStatus
    if (dto.action === 'priority') data.priority = dto.value as TicketPriority
    const result = await this.prisma.aiSupportTicket.updateMany({ where: { id: { in: dto.ids } }, data })
    if (dto.action === 'tag') {
      const tickets = await this.prisma.aiSupportTicket.findMany({ where: { id: { in: dto.ids } }, select: { id: true, tags: true } })
      await this.prisma.$transaction(tickets.map(ticket => this.prisma.aiSupportTicket.update({
        where: { id: ticket.id }, data: { tags: Array.from(new Set([...ticket.tags, dto.value])) },
      })))
    }
    return { updated: dto.action === 'tag' ? dto.ids.length : result.count }
  }

  getAgents() {
    return this.prisma.user.findMany({
      where: { role: 'admin', isActive: true }, select: { id: true, fullName: true, email: true }, orderBy: { fullName: 'asc' },
    })
  }

  getMacros() {
    return this.prisma.supportMacro.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  }

  createMacro(adminId: string, dto: CreateSupportMacroDto) {
    return this.prisma.supportMacro.create({ data: { ...dto, tags: dto.tags ?? [], createdById: adminId } })
  }

  async saveCsat(id: string, userId: string, dto: SupportCsatDto) {
    await this.assertTicket(id)
    return this.prisma.supportCsatResponse.upsert({
      where: { ticketId: id },
      create: { ticketId: id, userId, rating: dto.rating, comment: dto.comment },
      update: { rating: dto.rating, comment: dto.comment },
    })
  }

  private async assertTicket(id: string) {
    if (!await this.prisma.aiSupportTicket.findUnique({ where: { id }, select: { id: true } })) {
      throw new NotFoundException('SUPPORT_TICKET_NOT_FOUND')
    }
  }
}
